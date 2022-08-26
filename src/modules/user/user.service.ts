import BizException from '@exceptions/biz.exception'
import { AuthErrors, CommonErrors, NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { IFileUploaded } from '@interfaces/files.upload.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { forEach, toLower, trim } from 'lodash'
import {
    AdminUpdateProfileDto,
    CreateUserDto,
    SetupCredentialsDto,
    SetupTotpDto,
    UpdateEmailDto,
    UpdatePhoneDto,
    UpdateProfileDto,
    UpdateSecurityDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto,
    ForgotPasswordDto,
    ForgotPinDto,
    ResetPasswordDto,
    ResetPinDto
} from './user.dto'
import UserModel from './user.model'
import * as bcrypt from 'bcrypt'
import { unixTimestampToDate, generateRandomCode, generateUnixTimestamp } from '@utils/utility'
import { IUser, IUserQueryFilter } from '@modules/user/user.interface'
import { QueryRO } from '@interfaces/query.model'
import { getNewSecret, verifyNewDevice } from '@utils/totp'
import { stripPhoneNumber } from '@utils/phoneNumber'
import VerificationCodeService from '@modules/verification_code/code.service'
import sendSms from '@utils/sms'
import AuthService from '@modules/auth/auth.service'
import EmailService from '@modules/emaill/email.service'
import UserHistoryModel from '@modules/user_history/user_history.model'
import AdminLogModel from '@modules/admin_logs/admin_log.model'
import { role } from '@config/role'
import {
    CodeType,
    UserStatus,
    UserHistoryActions,
    AdminLogsActions,
    AdminLogsSections,
    MFAType,
    NFT_IMAGE_SIZES,
    USER_AVATAR_SIZES
} from '@config/constants'
import SettingService from '@modules/setting/setting.service'
import { ISetting } from '@modules/setting/setting.interface'
import AccountService from '@modules/account/account.service'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { BriefUserRO } from '@interfaces/public.model'

export default class UserService extends AuthService {
    public static async register(userData: CreateUserDto, options?: any) {
        userData = await this.formatCreateUserDto(userData)
        await this.verifyRegistration(userData)
        const setting: ISetting = await SettingService.getGlobalSetting()
        const mfaSettings = { type: MFAType.EMAIL, login_enabled: setting.login_require_mfa, withdraw_enabled: setting.withdraw_require_mfa }
        let emailVerified = false
        if (setting.registration_require_email_verified) {
            emailVerified = true
            mfaSettings.type = MFAType.EMAIL
        }
        let phoneVerified = false
        if (setting.registration_require_phone_verified) {
            phoneVerified = true
            mfaSettings.type = MFAType.SMS
        }
        const currentTimestamp = generateUnixTimestamp()

        const mode = new UserModel({
            ...userData,
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            avatar: null,
            role: 0,
            email_verified: emailVerified,
            phone_verified: phoneVerified,
            mfa_settings: mfaSettings,
            token_version: currentTimestamp
        })

        // create accounts before save data
        await AccountService.initUserAccounts(mode.key)

        await mode.save()

        // create log
        new UserHistoryModel({
            user_key: mode.key,
            action: UserHistoryActions.Register,
            agent: options?.req.agent,
            country: mode.country,
            ip_address: options?.req.ip_address,
            pre_data: null,
            post_data: {
                first_name: mode.first_name,
                last_name: mode.last_name,
                chat_name: mode.chat_name,
                phone: mode.phone,
                email: mode.email,
                mfa_settings: mode.mfa_settings
            }
        }).save()

        options.force_login = true
        return this.logIn({ email: userData.email, password: userData.password, token: null }, options)
    }

    public static uploadAvatar = async (files: any, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ email: options.req.user?.email, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'uploadAvatar', {}))
        }

        if (!files || !files.length) {
            throw new BizException(AuthErrors.image_required_error, new ErrorContext('user.service', 'uploadAvatar', {}))
        }

        files = await resizeImages(files, { avatar: USER_AVATAR_SIZES })
        const assets = await uploadFiles(files, 'avatar')

        let avatars: { [key: string]: string } = {}
        forEach(assets, file => {
            avatars = {
                ...avatars,
                [file.type]: file.key
            }
        })

        user?.set('avatar', avatars, Object)
        await user?.save()
        return avatars
    }

    public static updateProfile = async (params: UpdateProfileDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key: options.req.user.key, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        const postChatName = trim(toLower(params.chat_name))
        const preChatName = trim(toLower(user.chat_name))
        if (preChatName !== postChatName) {
            const existUser = await UserModel.findOne({ chat_name: new RegExp(postChatName, 'i'), removed: false }).exec()
            if (existUser) {
                throw new BizException(
                    AuthErrors.registration_chatname_exist_error,
                    new ErrorContext('user.service', 'updateProfile', { chatName: postChatName })
                )
            }
        }

        // create log
        await new UserHistoryModel({
            user_key: user.key,
            action: UserHistoryActions.UpdateProfile,
            agent: options?.req.agent,
            country: user.country,
            ip_address: options?.req.ip_address,
            pre_data: {
                first_name: user.first_name,
                last_name: user.last_name,
                chat_name: user.chat_name
            },
            post_data: {
                first_name: params.first_name,
                last_name: params.last_name,
                chat_name: params.chat_name
            }
        }).save()

        // save
        user.set('first_name', params.first_name || user.first_name, String)
        user.set('last_name', params.last_name || user.last_name, String)
        user.set('chat_name', params.chat_name || user.chat_name, String)
        await user.save()

        return user
    }

    public static updateProfileByAdmin = async (key: string, params: AdminUpdateProfileDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        const postChatName = trim(toLower(params.chat_name))
        const preChatName = trim(toLower(user.chat_name))
        if (preChatName !== postChatName) {
            const existUser = await UserModel.findOne({ chatName: new RegExp(postChatName, 'i'), removed: false }).exec()
            if (existUser) {
                throw new BizException(
                    AuthErrors.registration_chatname_exist_error,
                    new ErrorContext('user.service', 'updateProfile', { chatName: postChatName })
                )
            }
        }
        const email = trim(toLower(params.email))
        if (email) {
            const existingUser = await UserModel.findOne({ email, removed: false }).exec()
            if (existingUser && existingUser.key !== user.key) {
                throw new BizException(AuthErrors.registration_email_exists_error, new ErrorContext('user.service', 'updateEmail', { email }))
            }
        }
        const phone = await stripPhoneNumber(params.phone)
        if (phone) {
            const existingUser = await UserModel.findOne({ phone, removed: false }).exec()
            if (existingUser && existingUser.key !== user.key) {
                throw new BizException(AuthErrors.registration_phone_exists_error, new ErrorContext('user.service', 'updatePhone', {}))
            }
        }

        // create log
        await new AdminLogModel({
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            user_key: user.key,
            action: AdminLogsActions.UpdateUser,
            section: AdminLogsSections.User,
            pre_data: {
                first_name: user.first_name,
                last_name: user.last_name,
                chat_name: user.chat_name,
                phone: user.phone,
                email: user.email
            },
            post_data: {
                first_name: params.first_name,
                last_name: params.last_name,
                chat_name: params.chat_name,
                phone: phone || user.phone,
                email: email || user.email
            }
        }).save()

        // save
        user.set('first_name', params.first_name || user.first_name, String)
        user.set('last_name', params.last_name || user.last_name, String)
        user.set('chat_name', params.chat_name || user.chat_name, String)
        user.set('phone', phone || user.phone, String)
        user.set('email', email || user.email, String)
        await user.save()

        return user
    }

    static async forgotPassword(params: ForgotPasswordDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone').exec()
        }

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPassword', {}))
        }

        const deliveryMethod = (owner: any, code: string) => {
            if (params.type === 'email') {
                EmailService.sendUserForgotPasswordEmail({ address: owner, code: code })
            } else {
                sendSms(
                    'LightLink',
                    `[LightLink] You have recently requested a password reset, please enter this code ${code} into your mobile APP.`,
                    owner
                )
            }
        }
        await VerificationCodeService.generateCode(
            {
                owner: params.owner,
                user_key: user.key,
                code_type: CodeType.ForgotPassword
            },
            deliveryMethod
        )

        return { success: true }
    }

    static async resetPassword(params: ResetPasswordDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone pin password').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone pin password').exec()
        }
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'resetPassword', {}))
        }
        const isPinCodeMatching = await bcrypt.compare(params.pin, user.get('pin', null, { getters: false }))
        if (!isPinCodeMatching) {
            throw new BizException(AuthErrors.invalid_pin_code_error, new ErrorContext('auth.service', 'resetPassword', {}))
        }
        const { success } = await VerificationCodeService.verifyCode({
            owner: params.owner,
            code: params.code,
            code_type: CodeType.ForgotPassword
        })
        if (success) {
            EmailService.sendUserPasswordResetCompletedEmail({ address: user.email })
            const newPassHashed = await bcrypt.hash(params.password, 10)

            // log
            new UserHistoryModel({
                user_key: user.key,
                action: UserHistoryActions.ResetPassword,
                agent: options?.req.agent,
                country: user.country,
                ip_address: options?.req.ip_address,
                pre_data: {
                    password: user.password
                },
                post_data: {
                    password: newPassHashed
                }
            }).save()

            user.set('password', newPassHashed, String)
            user.save()

            // logout
            await AuthService.updateTokenVersion(user.key, currentTimestamp)
        }
        return { success }
    }

    static async forgotPin(params: ForgotPinDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone').exec()
        }

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        const deliveryMethod = (owner: any, code: string) => {
            if (params.type === 'email') {
                EmailService.sendUserForgotPinEmail({ address: owner, code: code })
            } else {
                sendSms(
                    'LightLink',
                    `[LightLink] You have recently requested a PIN reset, please enter this code ${code} into your mobile APP.`,
                    owner
                )
            }
        }
        await VerificationCodeService.generateCode(
            {
                owner: user.key,
                user_key: user.key,
                code_type: CodeType.ForgotPin
            },
            deliveryMethod
        )
        return { success: true }
    }

    static async resetPin(params: ResetPinDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone password').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone password').exec()
        }
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'resetPin', {}))
        }
        const isPasswordMatching = await bcrypt.compare(params.password, user.get('password', null, { getters: false }))
        if (!isPasswordMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'resetPin', {}))
        }

        const { success } = await VerificationCodeService.verifyCode({
            owner: user.key,
            code: params.code,
            code_type: CodeType.ForgotPin
        })
        if (success) {
            const newPin = await bcrypt.hash(params.pin, 10)
            EmailService.sendUserPinResetCompletedEmail({ address: user.email })
            // log
            new UserHistoryModel({
                user_key: user.key,
                action: UserHistoryActions.ResetPin,
                agent: options?.req.agent,
                country: user.country,
                ip_address: options?.req.ip_address,
                pre_data: {
                    pin: user.pin
                },
                post_data: {
                    pin: newPin
                }
            }).save()

            user.set('pin', newPin, String)
            user.save()

            // logout
            await AuthService.updateTokenVersion(user.key, currentTimestamp)
        }
        return { success }
    }

    public static getProfile = async (key: string) => {
        const user = await UserModel.findOne({ key, removed: false }).exec()
        return user
    }

    public static getBriefByName = async (chatName: string) => {
        return await UserModel.findOne({ chat_name: chatName, removed: false }).select('key first_name last_name email avatar chat_name').exec()
    }

    public static getBriefByKey = async (key: string) => {
        return await UserModel.findOne({ key: key, removed: false }).select('key first_name last_name email avatar chat_name').exec()
    }

    public static getTotp = async (options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key: options?.req?.user?.key, removed: false }).exec()
        const totpTemp = getNewSecret()
        user?.set('totp_temp_secret', totpTemp.secret)
        await user?.save()
        return { totp_temp: totpTemp }
    }

    public static setTotp = async (params: SetupTotpDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key: options?.req?.user?.key, removed: false }).select('key totp_temp_secret').exec()
        const secret = user?.totp_temp_secret
        const verified = await verifyNewDevice(secret, params.token1, params.token2)
        if (!verified) {
            throw new BizException(AuthErrors.user_token_setup_error, new ErrorContext('user.service', 'updateProfile', { email: user?.email }))
        }

        // create log
        await new UserHistoryModel({
            user_key: options?.req?.user?.key,
            action: UserHistoryActions.SetupTOTP,
            agent: options?.req.agent,
            country: options.req.user.country,
            ip_address: options?.req.ip_address,
            pre_data: {
                mfa_settings: options.req.user.mfa_settings
            },
            post_data: {
                mfa_settings: {
                    type: MFAType.TOTP,
                    login_enabled: options.req.user.mfa_settings.login_enabled,
                    withdraw_enabled: options.req.user.mfa_settings.withdraw_enabled
                }
            }
        }).save()

        user?.set('totp_temp_secret', null)
        user?.set('totp_secret', secret)
        user?.set('totp_setup', true)
        user?.set('mfa_settings.type', MFAType.TOTP)
        await user?.save()
        return user
    }

    public static updateSecurity = async (key: string, params: UpdateSecurityDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateSecurity', {}))
        }
        // Check permission
        if (user.key !== options?.req?.user?.key && options.req.user.role !== role.admin.id) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('user.service', 'updateSecurity', {}))
        }
        const type = params.type.toUpperCase()
        const loginEnabled = String(params.login_enabled).toLowerCase() === 'true'
        const withdrawEnabled = String(params.withdraw_enabled).toLowerCase() === 'true'

        // create log
        await new UserHistoryModel({
            user_key: user.key,
            action: UserHistoryActions.UpdateSecurity,
            agent: options?.req.agent,
            country: user.country,
            ip_address: options?.req.ip_address,
            pre_data: {
                mfa_settings: user.mfa_settings
            },
            post_data: {
                mfa_settings: {
                    type,
                    login_enabled: loginEnabled,
                    withdraw_enabled: withdrawEnabled
                }
            }
        }).save()

        user.set('mfa_settings', {
            type,
            login_enabled: loginEnabled,
            withdraw_enabled: withdrawEnabled
        })
        await user?.save()
        return user
    }

    public static getUserList = async (params: IUserQueryFilter) => {
        const offset = (params.page_index - 1) * params.page_size
        const reg = new RegExp(params.terms)
        const filter: { [key: string]: any } = {
            $or: [{ key: reg }, { email: reg }, { phone: reg }],
            $and: [{ created: { $exists: true } }],
            removed: false
        }
        if (params.date_from) {
            const dateFrom = unixTimestampToDate(params.date_from)
            filter.$and.push({ created: { $gte: dateFrom } })
        }
        if (params.date_to) {
            const dateTo = unixTimestampToDate(params.date_to)
            filter.$and.push({ created: { $lt: dateTo } })
        }
        const sorting: any = { _id: 1 }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await UserModel.countDocuments(filter)
        const items = await UserModel.find<IUser>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<IUser>(totalCount, params.page_index, params.page_size, items)
    }

    public static searchUser = async (params: IUserQueryFilter) => {
        const reg = new RegExp(params.terms)
        const filter: { [key: string]: any } = {
            $or: [{ chat_name: reg }],
            $and: [{ created: { $exists: true } }],
            removed: false
        }
        const sorting: any = { _id: 1 }
        const items = await UserModel.find<IUser>(filter).sort(sorting).skip(0).limit(50).exec()
        return new BriefUserRO(items)
    }

    public static getAllUser = async () => {
        const items = await UserModel.find<IUser>({ removed: false }).exec()
        return items
    }

    public static async resetCredentials(key: string, options: { req: AuthenticationRequest }) {
        const user = await UserModel.findOne({ key, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        await new AdminLogModel({
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            user_key: user.key,
            action: AdminLogsActions.ResetCredentialsUser,
            section: AdminLogsSections.User
        }).save()

        const changePasswordNextLoginCode = generateRandomCode(8, 8, true)
        const changePasswordNextLoginTimestamp = generateUnixTimestamp()
        user.set('change_password_next_login', true)
        user.set('change_password_next_login_code', changePasswordNextLoginCode)
        user.set('change_password_next_login_timestamp', changePasswordNextLoginTimestamp)
        user.set('token_version', changePasswordNextLoginTimestamp)
        user.set('mfa_settings.login_enabled', false)
        user.set('login_count', 0)
        user.set('locked_timestamp', 0)
        await user.save()

        if (user.email) {
            EmailService.sendUserResetCredentialsNotification({ address: user.email, code: changePasswordNextLoginCode })
        } else if (user.phone) {
            const content = `[LightLink] Your acount has been reset, please use ${changePasswordNextLoginCode} as your password to log in within the next 15 minutes.`
            sendSms('LightLink', content, user.phone)
        }

        return { success: true }
    }

    public static async setupCredentials(params: SetupCredentialsDto, options: { req: AuthenticationRequest }) {
        const email = toLower(trim(params.email))
        const user = await UserModel.findOne({ email, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        if (!user.change_password_next_login || user.change_password_next_login !== true) {
            throw new BizException(CommonErrors.bad_request, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        let changePasswordNextLoginAttempts = user.change_password_next_login_attempts || 0
        if (changePasswordNextLoginAttempts >= 5) {
            user.set('status', UserStatus.Locked, String)
            user.save()
            throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        const currentTimestamp = generateUnixTimestamp()
        changePasswordNextLoginAttempts++
        user.set('change_password_next_login_attempts', changePasswordNextLoginAttempts, Number)
        await user.save()

        if (
            !user.change_password_next_login_code ||
            toLower(user.change_password_next_login_code.toLowerCase()) !== toLower(params.code) ||
            user.change_password_next_login_timestamp < currentTimestamp - 60 * 15
        ) {
            throw new BizException(
                AuthErrors.user_reset_credentials_incorrect_code_error,
                new ErrorContext('user.service', 'setupCredentials', { email })
            )
        }

        // create log
        await new UserHistoryModel({
            user_key: user.key,
            action: UserHistoryActions.SetupCredentials,
            agent: options?.req.agent,
            country: user.country,
            ip_address: options?.req.ip_address,
            pre_data: {},
            post_data: {}
        }).save()

        const newPassHashed = await bcrypt.hash(params.password, 10)
        user.set('password', newPassHashed, String)

        const newPinHashed = await bcrypt.hash(params.pin, 10)
        user.set('pin', newPinHashed, String)
        user.set('change_password_next_login', false)
        user.set('change_password_next_login_code', '')
        user.set('change_password_next_login_timestamp', 0)
        user.set('login_count', 0)
        user.set('locked_timestamp', 0)
        await user.save()

        if (user.email) {
            EmailService.sendUserResetCredentialsCompletedNotification({ address: user.email })
        }

        return { success: true }
    }

    static async updateUserStatus(userKey: string, params: UpdateUserStatusDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'lockUser', {}))
        }

        // create log
        await new AdminLogModel({
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            user_key: user.key,
            action: params.status + 'User',
            section: AdminLogsSections.User,
            pre_data: {
                status: user.status
            },
            post_data: {
                status: params.status
            }
        }).save()

        user?.set('status', params.status, String)
        await user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return user
    }

    static async removeUser(userKey: string, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'removeUser', {}))
        }

        // create log
        await new AdminLogModel({
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            user_key: user.key,
            action: AdminLogsActions.RemoveUser,
            section: AdminLogsSections.User,
            pre_data: {
                removed: user.removed
            },
            post_data: {
                removed: true
            }
        }).save()

        user?.set('removed', true, Boolean)
        await user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return { success: true }
    }

    static async resetTotp(userKey: string, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'resetTotp', {}))
        }
        if (user.mfa_settings.type === MFAType.TOTP) {
            user?.set('mfa_settings.type', MFAType.EMAIL, String)
        }

        // create log
        await new AdminLogModel({
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            user_key: user.key,
            action: AdminLogsActions.ResetTOPTUser,
            section: AdminLogsSections.User,
            pre_data: {
                totp_secret: user.totp_secret,
                totp_setup: user.totp_setup
            },
            post_data: {
                totp_secret: null,
                totp_setup: false
            }
        }).save()

        user?.set('totp_secret', null, null)
        user?.set('totp_setup', false, Boolean)
        await user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return user
    }

    static async updateUserRole(userKey: string, params: UpdateUserRoleDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUserRole', {}))
        }

        // create log
        await new AdminLogModel({
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            user_key: user.key,
            action: AdminLogsActions.UpdateRoleUser,
            section: AdminLogsSections.User,
            pre_data: {
                role: user.role
            },
            post_data: {
                role: Number(params.role)
            }
        }).save()

        user?.set('role', Number(params.role), Number)
        await user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return user
    }

    static async updatePhone(userKey: string, params: UpdatePhoneDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updatePhone', {}))
        }

        const phone = await stripPhoneNumber(params.phone)
        // check phone is available
        const existingUser = await UserModel.findOne({ phone, removed: false }).exec()
        if (existingUser && existingUser.key !== user.key) {
            throw new BizException(AuthErrors.registration_phone_exists_error, new ErrorContext('user.service', 'updatePhone', {}))
        }
        await VerificationCodeService.verifyCode({ code: params.code, code_type: CodeType.PhoneUpdate, owner: phone })

        // create log
        new UserHistoryModel({
            user_key: user.key,
            action: UserHistoryActions.UpdatePhone,
            agent: options?.req.agent,
            country: user.country,
            ip_address: options?.req.ip_address,
            pre_data: {
                phone: user.phone
            },
            post_data: {
                phone: phone
            }
        }).save()

        // save
        user?.set('phone', phone, String)
        user?.save()

        await AuthService.updateTokenVersion(userKey, currentTimestamp)
        return user
    }

    static async updateEmail(userKey: string, params: UpdateEmailDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateEmail', {}))
        }
        const email = trim(toLower(params.email))
        const existingUser = await UserModel.findOne({ email, removed: false }).exec()
        if (existingUser && existingUser.key !== user.key) {
            throw new BizException(AuthErrors.registration_email_exists_error, new ErrorContext('user.service', 'updateEmail', { email }))
        }
        await VerificationCodeService.verifyCode({ code: params.code, code_type: CodeType.EmailUpdate, owner: email })

        // create log
        await new UserHistoryModel({
            user_key: user.key,
            action: UserHistoryActions.UpdateEmail,
            agent: options?.req.agent,
            country: user.country,
            ip_address: options?.req.ip_address,
            pre_data: {
                email: user.email
            },
            post_data: {
                email: email
            }
        }).save()

        // save
        user?.set('email', email, String)
        await user?.save()

        // logout & send email notifications
        EmailService.sendUserChangeEmailCompletedEmail({ address: email })
        await AuthService.updateTokenVersion(userKey, currentTimestamp)
        return user
    }
}
