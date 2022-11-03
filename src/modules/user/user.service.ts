import BizException from '@exceptions/biz.exception'
import { AuthErrors, CommonErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { find, forEach, toLower, trim } from 'lodash'
import {
    AdminUpdateProfileDto,
    AuthorizeDto,
    BulkUpdateUserFeaturedDto,
    CreateUserDto,
    EmailVerifyDto,
    ForgotPasswordDto,
    ForgotPinDto,
    ResetPasswordDto,
    ResetPinDto,
    SetupCredentialsDto,
    SetupTotpDto,
    UpdateEmailDto,
    UpdatePhoneDto,
    UpdateProfileDto,
    UpdateSecurityDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto
} from './user.dto'
import UserModel from './user.model'
import * as bcrypt from 'bcryptjs'
import { generateRandomCode, generateUnixTimestamp, roundUp, unixTimestampToDate } from '@utils/utility'
import { IUser, IUserQueryFilter, IUserRanking } from '@modules/user/user.interface'
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
    AdminLogsActions,
    AdminLogsSections,
    CodeType,
    MFAType,
    NftStatus,
    USER_AVATAR_SIZES,
    USER_BACKGROUND_IMAGE_SIZES,
    UserAuthType,
    UserHistoryActions,
    UserStatus
} from '@config/constants'
import SettingService from '@modules/setting/setting.service'
import { ISetting } from '@modules/setting/setting.interface'
import AccountService from '@modules/account/account.service'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { NftModel, NftSaleLogModel } from '@modules/nft/nft.model'
import { RateModel } from '@modules/exchange_rate/rate.model'
import { config } from '@config'
import UserFollowerModel from '@modules/user_follower/user.follower.model'
import NftFavoriteModel from '@modules/nft_favorite/nft.favorite.model'
import IOptions from '@interfaces/options.interface'
import { IOperator } from '@interfaces/operator.interface'
import { UserRankingModel } from '@modules/user/user.ranking.model'
import moment from 'moment'
import { UserAnalyticRO } from './user.ro'

export default class UserService extends AuthService {
    public static async authorize(params: AuthorizeDto, options?: any) {
        if (params.type === UserAuthType.Email) {
            return AuthService.authorizeByEmail(params, options)
        }
        if (params.type === UserAuthType.Phone) {
            return AuthService.authorizeByPhone(params, options)
        }
        if (params.type === UserAuthType.Google) {
            return AuthService.authorizeViaGoogle(params, options)
        }
        if (params.type === UserAuthType.Apple) {
            return AuthService.authorizeViaApple(params, options)
        }
        throw new BizException(AuthErrors.user_authorize_method_error, new ErrorContext('user.service', 'userAuth', {}))
    }

    public static async register(userData: CreateUserDto, options?: IOptions) {
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
            key: undefined,
            ...userData,
            chat_name: await UserModel.generateRandomChatName(userData.chat_name),
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            role: 0,
            email_verified: emailVerified,
            phone_verified: phoneVerified,
            mfa_settings: mfaSettings,
            token_version: currentTimestamp,
            locked_timestamp: currentTimestamp,
            status: UserStatus.Normal,
            login_count: 0,
            number_of_followers: 0,
            featured: false
        })

        // create accounts before save data
        if (mode.key) {
            await AccountService.initUserAccounts(mode.key)
        }

        await mode.save()

        // create log
        new UserHistoryModel({
            key: undefined,
            user_key: mode.key,
            action: UserHistoryActions.Register,
            operator: { key: mode.key },
            options: options,
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

        return this.logIn({ email: userData.email, password: userData.password, token: undefined }, true, options)
    }

    public static uploadAvatar = async (files: any, operator: IOperator, options?: IOptions) => {
        const user = await UserModel.findOne({ key: operator.key, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'uploadAvatar', {}))
        }

        if (!files || !files.length) {
            throw new BizException(AuthErrors.image_required_error, new ErrorContext('user.service', 'uploadAvatar', {}))
        }

        files = await resizeImages(files, { avatar: USER_AVATAR_SIZES })
        const assets = await uploadFiles(files, 'user')

        let avatars: { [key: string]: string } = {}
        forEach(assets, file => {
            avatars = {
                ...avatars,
                [file.type]: file.key
            }
        })

        user?.set('avatar', avatars, Object)
        await user?.save()
        return user
    }

    public static uploadBackground = async (files: any, operator: IOperator, options?: IOptions) => {
        const user = await UserModel.findOne({ key: operator.key, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'uploadBackgroundImage', {}))
        }

        if (!files || !files.length) {
            throw new BizException(AuthErrors.image_required_error, new ErrorContext('user.service', 'uploadBackgroundImage', {}))
        }

        files = await resizeImages(files, { background: USER_BACKGROUND_IMAGE_SIZES })
        const assets = await uploadFiles(files, 'user')

        let background: { [key: string]: string } = {}
        forEach(assets, file => {
            background = {
                ...background,
                [file.type]: file.key
            }
        })

        user?.set('background', background, Object)
        await user?.save()
        return user
    }

    public static updateProfile = async (params: UpdateProfileDto, operator: IOperator, options?: IOptions) => {
        const user = await UserModel.findOne({ key: operator.key, removed: false }).exec()
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
            key: undefined,
            user_key: user.key,
            action: UserHistoryActions.UpdateProfile,
            operator,
            options,
            pre_data: {
                first_name: user.first_name,
                last_name: user.last_name,
                chat_name: user.chat_name,
                bio: user.bio,
                twitter: user.twitter,
                instagram: user.instagram
            },
            post_data: {
                first_name: params.first_name,
                last_name: params.last_name,
                chat_name: params.chat_name,
                bio: params.bio,
                twitter: params.twitter,
                instagram: params.instagram
            }
        }).save()

        // save
        user.set('first_name', params.first_name, String)
        user.set('last_name', params.last_name, String)
        user.set('chat_name', params.chat_name, String)
        user.set('bio', params.bio, String)
        user.set('twitter', params.twitter, String)
        user.set('instagram', params.instagram, String)
        await user.save()

        return user
    }

    public static updateProfileByAdmin = async (key: string, params: AdminUpdateProfileDto, operator: IOperator, options?: IOptions) => {
        const user = await UserModel.findOne({ key, removed: false }).exec()
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
                    new ErrorContext('user.service', 'updateProfile', { chat_name: postChatName })
                )
            }
        }
        const email = trim(toLower(params.email))
        if (email) {
            const existingUser = await UserModel.findOne({ email, removed: false }).exec()
            if (existingUser && existingUser.key !== user.key) {
                throw new BizException(AuthErrors.registration_email_exists_error, new ErrorContext('user.service', 'updateEmail', { email }))
            }
            user.set('email', email, String)
            user.set('email_verified', true, Boolean)
        }
        const phone = await stripPhoneNumber(params.phone)
        if (phone) {
            const existingUser = await UserModel.findOne({ phone, removed: false }).exec()
            if (existingUser && existingUser.key !== user.key) {
                throw new BizException(AuthErrors.registration_phone_exists_error, new ErrorContext('user.service', 'updatePhone', {}))
            }
            user.set('phone', phone, String)
            user.set('phone_verified', true, Boolean)
        }
        user.set('bio', params.bio, String)
        user.set('twitter', params.twitter, String)
        user.set('instagram', params.instagram, String)
        // save
        user.set('first_name', params.first_name || user.first_name, String)
        user.set('last_name', params.last_name || user.last_name, String)
        user.set('chat_name', params.chat_name || user.chat_name, String)

        await user.save()
        // create log
        await new AdminLogModel({
            key: undefined,
            user_key: user.key,
            operator,
            options,
            action: AdminLogsActions.UpdateUser,
            section: AdminLogsSections.User,
            pre_data: {
                first_name: user.first_name,
                last_name: user.last_name,
                chat_name: user.chat_name,
                phone: user.phone,
                email: user.email,
                bio: user.bio,
                twitter: user.twitter,
                instagram: user.instagram
            },
            post_data: {
                first_name: params.first_name,
                last_name: params.last_name,
                chat_name: params.chat_name,
                phone: phone,
                email: email,
                bio: params.bio,
                twitter: params.twitter,
                instagram: params.instagram
            }
        }).save()

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

    static async resetPassword(params: ResetPasswordDto, options?: IOptions) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone pin password').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone pin password').exec()
        }
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'resetPassword', {}))
        }
        const isPinCodeMatching = await bcrypt.compare(params.pin, user.get('pin', null, { getters: false }))
        if (!isPinCodeMatching) {
            throw new BizException(AuthErrors.invalid_pin_code_error, new ErrorContext('user.service', 'resetPassword', {}))
        }
        const { success } = await VerificationCodeService.verifyCode({
            owner: params.owner,
            code: params.code,
            code_type: CodeType.ForgotPassword
        })
        if (success && user.email) {
            EmailService.sendUserPasswordResetCompletedEmail({ address: user.email })
            const newPassHashed = await bcrypt.hash(params.password, 10)

            // log
            new UserHistoryModel({
                key: undefined,
                user_key: user.key,
                action: UserHistoryActions.ResetPassword,
                country: user.country,
                operator: { key: user.key },
                options,
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
            await AuthService.updateTokenVersion(user.key)
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

        if (!user || !user.key) {
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

    static async resetPin(params: ResetPinDto, options?: IOptions) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone password').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone password').exec()
        }
        if (!user || !user.key) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'resetPin', {}))
        }
        const isPasswordMatching = await bcrypt.compare(params.password, user.get('password', null, { getters: false }))
        if (!isPasswordMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('user.service', 'resetPin', {}))
        }

        const { success } = await VerificationCodeService.verifyCode({
            owner: user.key,
            code: params.code,
            code_type: CodeType.ForgotPin
        })
        if (success && user.email) {
            const newPin = await bcrypt.hash(params.pin, 10)
            EmailService.sendUserPinResetCompletedEmail({ address: user.email })
            // log
            new UserHistoryModel({
                user_key: user.key,
                action: UserHistoryActions.ResetPin,
                operator: { key: user.key },
                options: options,
                country: user.country,
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
            await AuthService.updateTokenVersion(user.key)
        }
        return { success }
    }

    public static getProfile = async (key: string) => {
        const user = await UserModel.findOne({ key, removed: false }).exec()
        return user
    }

    public static getBriefByName = async (chatName: string) => {
        const data = await UserModel.getBriefByChatName(chatName)
        return data
    }

    public static getBriefByKey = async (key: string, includeEmail = false) => {
        const data = await UserModel.getBriefByKey(key, includeEmail)
        return data
    }

    public static getTotp = async (operator: IOperator) => {
        const user = await UserModel.findOne({ key: operator.key, removed: false }).exec()
        if (!user || !user.key) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'getTotp', { key: operator.key }))
        }
        const totpTemp = getNewSecret()
        user?.set('totp_temp_secret', totpTemp.secret)
        await user?.save()
        return { totp_temp: totpTemp }
    }

    public static setTotp = async (params: SetupTotpDto, operator: IOperator, options?: IOptions) => {
        const user = await UserModel.findOne({ key: operator.key, removed: false }).select('key totp_temp_secret mfa_settings').exec()
        if (!user || !user.key) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'setTotp', { key: operator.key }))
        }
        const secret = user?.totp_temp_secret
        const verified = await verifyNewDevice(secret, params.token1, params.token2)
        if (!verified) {
            throw new BizException(AuthErrors.user_token_setup_error, new ErrorContext('user.service', 'updateProfile', { email: user?.email }))
        }

        // create log
        await new UserHistoryModel({
            key: undefined,
            user_key: user.key,
            action: UserHistoryActions.SetupTOTP,
            operator,
            options,
            pre_data: {
                mfa_settings: user.mfa_settings
            },
            post_data: {
                mfa_settings: {
                    type: MFAType.TOTP
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

    public static updateSecurity = async (key: string, params: UpdateSecurityDto, operator: IOperator, options?: IOptions) => {
        const user = await UserModel.findOne({ key, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateSecurity', {}))
        }
        // Check permission
        if (user.key !== operator.key && operator.role !== role.admin.id) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('user.service', 'updateSecurity', {}))
        }
        const type = params.type.toUpperCase()
        const loginEnabled = String(params.login_enabled).toLowerCase() === 'true'
        const withdrawEnabled = String(params.withdraw_enabled).toLowerCase() === 'true'

        // create log
        await new UserHistoryModel({
            key: undefined,
            user_key: user.key,
            action: UserHistoryActions.UpdateSecurity,
            operator,
            options,
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
        const reg = new RegExp(params.terms, 'i')
        const filter: { [key: string]: any } = {
            $or: [{ key: reg }, { email: reg }, { phone: reg }],
            $and: [{ created: { $exists: true } }, { removed: false }],
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
        if (params.featured) {
            filter.$and.push({ featured: { $eq: params.featured } })
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
        const offset = (params.page_index - 1) * params.page_size
        const reg = new RegExp(params.terms, 'i')
        const filter: { [key: string]: any } = {
            $or: [{ first_name: reg }, { last_name: reg }, { chat_name: reg }],
            removed: false
        }
        const sorting: any = { _id: 1 }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await UserModel.countDocuments(filter)
        const items = await UserModel.find<IUser>(filter, { key: 1, first_name: 1, last_name: 1, chat_name: 1, avatar: 1 })
            .sort(sorting)
            .skip(offset)
            .limit(params.page_size)
            .exec()
        return new QueryRO<IUser>(totalCount, params.page_index, params.page_size, items)
    }

    public static getAllUser = async () => {
        const items = await UserModel.find<IUser>({ removed: false }).exec()
        return items
    }

    public static async resetCredentials(key: string, operator: IOperator, options?: IOptions) {
        const user = await UserModel.findOne({ key, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        await new AdminLogModel({
            key: undefined,
            user_key: user.key,
            operator,
            options,
            action: AdminLogsActions.ResetCredentialsUser,
            section: AdminLogsSections.User
        }).save()

        const changePasswordNextLoginCode = generateRandomCode(8, 8, true)
        const changePasswordNextLoginTimestamp = generateUnixTimestamp()
        const password_settings = {
            change_password_next_login: true,
            change_password_next_login_code: changePasswordNextLoginCode,
            change_password_next_login_timestamp: changePasswordNextLoginTimestamp
        }
        user.set('password_settings', password_settings)
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

    public static async setupCredentials(params: SetupCredentialsDto, options?: IOptions) {
        const email = toLower(trim(params.email))
        const user = await UserModel.findOne({ email, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        if (!user.password_settings || user.password_settings.change_password_next_login !== true) {
            throw new BizException(CommonErrors.bad_request, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        let changePasswordNextLoginAttempts = user.password_settings.change_password_next_login_attempts || 0
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
            !user.password_settings.change_password_next_login_code ||
            toLower(user.password_settings.change_password_next_login_code.toLowerCase()) !== toLower(params.code) ||
            user.password_settings.change_password_next_login_timestamp < currentTimestamp - 60 * 15
        ) {
            throw new BizException(
                AuthErrors.user_reset_credentials_incorrect_code_error,
                new ErrorContext('user.service', 'setupCredentials', { email })
            )
        }

        // create log
        await new UserHistoryModel({
            key: undefined,
            user_key: user.key,
            operator: { key: user.key },
            options,
            action: UserHistoryActions.SetupCredentials,
            pre_data: {},
            post_data: {}
        }).save()

        const newPassHashed = await bcrypt.hash(params.password, 10)
        user.set('password', newPassHashed, String)

        const newPinHashed = await bcrypt.hash(params.pin, 10)
        user.set('pin', newPinHashed, String)

        const password_settings = {
            change_password_next_login: false,
            change_password_next_login_code: '',
            change_password_next_login_timestamp: 0
        }
        user.set('password_settings', password_settings)
        user.set('login_count', 0)
        user.set('locked_timestamp', 0)
        await user.save()

        if (user.email) {
            EmailService.sendUserResetCredentialsCompletedNotification({ address: user.email })
        }

        return { success: true }
    }

    static async updateUserStatus(userKey: string, params: UpdateUserStatusDto, operator: IOperator, options?: IOptions) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'lockUser', {}))
        }

        // create log
        await new AdminLogModel({
            key: undefined,
            user_key: user.key,
            operator,
            options: options,
            action: AdminLogsActions.UpdateUserStatus,
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
        await AuthService.updateTokenVersion(userKey)

        return user
    }

    static async removeUser(userKey: string, operator: IOperator, options?: IOptions) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'removeUser', {}))
        }

        // create log
        await new AdminLogModel({
            key: undefined,
            user_key: user.key,
            operator,
            options,
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
        await AuthService.updateTokenVersion(userKey)

        return { success: true }
    }

    static async resetTotp(userKey: string, operator: IOperator, options?: IOptions) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'resetTotp', {}))
        }
        if (user.mfa_settings && user.mfa_settings.type === MFAType.TOTP) {
            user?.set('mfa_settings.type', MFAType.EMAIL, String)
        }

        // create log
        await new AdminLogModel({
            key: undefined,
            user_key: user.key,
            operator,
            options,
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
        await AuthService.updateTokenVersion(userKey)

        return user
    }

    static async updateUserRole(userKey: string, params: UpdateUserRoleDto, operator: IOperator, options?: IOptions) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUserRole', {}))
        }

        // create log
        await new AdminLogModel({
            key: undefined,
            user_key: user.key,
            operator,
            options,
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
        await AuthService.updateTokenVersion(userKey)

        return user
    }

    static async updatePhone(userKey: string, params: UpdatePhoneDto, operator: IOperator, options?: IOptions) {
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
            key: undefined,
            user_key: user.key,
            action: UserHistoryActions.UpdatePhone,
            operator,
            options,
            pre_data: {
                phone: user.phone
            },
            post_data: {
                phone: phone
            }
        }).save()

        // save
        user?.set('phone_verified', true, Boolean)
        user?.set('phone', phone, String)
        user?.save()

        await AuthService.updateTokenVersion(userKey)
        return user
    }

    static async updateEmail(userKey: string, params: UpdateEmailDto, operator: IOperator, options?: IOptions) {
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
            key: undefined,
            user_key: user.key,
            action: UserHistoryActions.UpdateEmail,
            operator,
            options,
            pre_data: {
                email: user.email
            },
            post_data: {
                email: email
            }
        }).save()

        // save
        user?.set('email', email, String)
        user?.set('email_verified', true, Boolean)
        await user?.save()

        // logout & send email notifications
        EmailService.sendUserChangeEmailCompletedEmail({ address: email })
        await AuthService.updateTokenVersion(userKey)
        return user
    }

    public static async getUserAssets(key: string) {
        const user = await UserModel.findOne({ key, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateEmail', {}))
        }

        const rateData = await RateModel.findOne({ symbol: `${config.system.primeToken}-USDT` }).exec()
        const rate = rateData ? rateData.rate : 1

        const accountsData = await AccountService.queryAccounts({ user_key: key }, { page_index: 1, page_size: 999 })
        const accounts: any = accountsData.items

        let amount_usd = 0
        let amount_usd_change = 0
        let percentage_change = 0
        for (const account of accounts) {
            const dailyChange = find(account.balance_change_statements, { period: 'day' })
            amount_usd += dailyChange.amount_usd
            amount_usd_change += dailyChange.amount_usd_change
        }
        percentage_change = amount_usd === 0 ? 0 : roundUp(amount_usd_change / amount_usd, 4)

        const tokens = {
            amount: amount_usd,
            amount_change: amount_usd_change,
            percentage_change,
            currency: 'USD'
        }

        const nftsAggre = await NftModel.aggregate([
            { $match: { owner_key: key, removed: false } },
            {
                $group: {
                    _id: null,
                    total_value: { $sum: '$price' },
                    number_of_nfts: { $sum: 1 }
                }
            }
        ])
        const nfts = { total_value: 0, total_usd_value: 0, number_of_nfts: 0, currency: 'USD' }
        if (nftsAggre && nftsAggre[0]) {
            nfts.total_value = nftsAggre[0].total_value
            nfts.number_of_nfts = nftsAggre[0].number_of_nfts
            nfts.total_usd_value = roundUp(nftsAggre[0].total_value * rate, 2)
        }

        return { tokens, nfts }
    }

    static async getEmailVerificationCode(userKey?: string) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()
        if (!user || !user.key) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'getEmailVerificationCode', {}))
        }
        if (!user.email) {
            throw new BizException(AuthErrors.user_has_no_email_error, new ErrorContext('user.service', 'getEmailVerificationCode', {}))
        }
        if (user.email_verified) {
            throw new BizException(AuthErrors.user_email_already_verified_error, new ErrorContext('user.service', 'getEmailVerificationCode', {}))
        }

        const deliveryMethod = (owner: any, code: string) => {
            EmailService.sendEmailVerificationCode({ address: user.email ?? '', code: code })
        }
        await VerificationCodeService.generateCode(
            {
                owner: user.key,
                user_key: user.key,
                code_type: CodeType.EmailVerification
            },
            deliveryMethod
        )
        return { success: true }
    }

    static async verifyEmailAddress(userKey: string, params: EmailVerifyDto) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()
        if (!user || !user.key) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'verifyEmailAddress', { userKey }))
        }
        const { success } = await VerificationCodeService.verifyCode({
            owner: user.key,
            code: params.code,
            code_type: CodeType.EmailVerification
        })
        if (success) {
            user.set('email_verified', true, Boolean)
            user.save()
        }
        return { success }
    }

    static async getUserAnalytics(userKey: string) {
        const user = await UserModel.getBriefByKey(userKey, false)
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'verifyEmailAddress', { userKey }))
        }
        const followers = await UserFollowerModel.countDocuments({ user_key: user.key })
        const followings = await UserFollowerModel.countDocuments({ follower_key: user.key })
        const nftLiked = await NftFavoriteModel.countDocuments({ user_key: user.key })
        const nftCreated = await NftModel.countDocuments({ creator_key: user.key })

        return new UserAnalyticRO(user, followers, followings, nftLiked, nftCreated)
    }

    static async getUserRanking(userKey: string) {
        let user = await UserModel.findOne({ key: userKey }, { key: 1, ranking: 1 })
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'getUserRanking', { userKey }))
        }

        if (user.ranking) {
            const requireUpdate = moment().subtract(-1, 'hour').isAfter(moment(user.ranking.updated))
            if (requireUpdate) {
                user = await UserService.generateUserRanking(userKey)
            }
        } else {
            user = await UserService.generateUserRanking(userKey)
        }
        return user?.ranking
    }

    static async bulkUpdateUserFeatured(params: BulkUpdateUserFeaturedDto, operator: IOperator, options?: IOptions) {
        const keys = params.keys.split ? params.keys.split(',') : params.keys
        const featured = String(params.featured).toLowerCase() === 'true'
        await UserModel.updateMany({ key: { $in: keys } }, { $set: { featured: featured } })
        return { success: true }
    }

    static async getBriefByKeys(userKeys: String[], includeEmail = false) {
        const nfts = await UserModel.getBriefByKeys(userKeys, includeEmail)
        return nfts
    }

    public static getTopUsers = async () => {
        const items = await UserModel.find<IUser>({ removed: false }, { key: 1, first_name: 1, last_name: 1, chat_name: 1, avatar: 1, ranking: 1 })
            .sort({ 'ranking.trading_volume_of_created_nfts': -1 })
            .limit(10)
            .exec()
        return items
    }

    static async generateUserRanking(userKey: string) {
        const number_of_followers = await UserFollowerModel.countDocuments({ user_key: userKey })
        const number_of_followings = await UserFollowerModel.countDocuments({ follower_key: userKey })
        const number_of_nft_liked = await NftFavoriteModel.countDocuments({ user_key: userKey })
        const number_of_nft_created = await NftModel.countDocuments({ creator_key: userKey, status: NftStatus.Approved })

        //  owners of created nfts
        const owners = await NftModel.aggregate([{ $match: { creator_key: userKey } }, { $group: { _id: '$owner_key', count: { $sum: 1 } } }])
        const number_of_created_nfts_owners = owners.length

        // trading volume of created nfts
        const volumeTotal = await NftSaleLogModel.aggregate([
            { $match: { 'creator.key': userKey } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_created_nfts_orders = volumeTotal && volumeTotal[0] ? volumeTotal[0].count : 0
        const trading_volume_of_created_nfts = volumeTotal && volumeTotal[0] ? parseFloat(volumeTotal[0].trading_volume) : 0

        // 24 hrs volume of created nfts
        const volume24Hrs = await NftSaleLogModel.aggregate([
            { $match: { 'creator.key': userKey, created: { $gte: moment().add(-1, 'days').toDate() } } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_created_nfts_orders_24hrs = volume24Hrs && volume24Hrs[0] ? volume24Hrs[0].count : 0
        const trading_volume_of_created_nfts_24hrs = volume24Hrs && volume24Hrs[0] ? parseFloat(volume24Hrs[0].trading_volume) : 0

        // trading volume of buying
        const buyingVolumeTotal = await NftSaleLogModel.aggregate([
            { $match: { 'buyer.key': userKey } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_buying_orders = buyingVolumeTotal && buyingVolumeTotal[0] ? buyingVolumeTotal[0].count : 0
        const trading_volume_of_buying = buyingVolumeTotal && buyingVolumeTotal[0] ? parseFloat(buyingVolumeTotal[0].trading_volume) : 0

        // 24 hrs volume of selling
        const buyingVolume24Hrs = await NftSaleLogModel.aggregate([
            { $match: { 'buyer.key': userKey, created: { $gte: moment().add(-1, 'days').toDate() } } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_buying_orders_24hrs = buyingVolume24Hrs && buyingVolume24Hrs[0] ? buyingVolume24Hrs[0].count : 0
        const trading_volume_of_buying_24hrs = buyingVolume24Hrs && buyingVolume24Hrs[0] ? parseFloat(buyingVolume24Hrs[0].trading_volume) : 0

        // trading volume of created nfts
        const sellingVolumeTotal = await NftSaleLogModel.aggregate([
            { $match: { 'seller.key': userKey } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_selling_orders = sellingVolumeTotal && sellingVolumeTotal[0] ? sellingVolumeTotal[0].count : 0
        const trading_volume_of_selling = sellingVolumeTotal && sellingVolumeTotal[0] ? parseFloat(sellingVolumeTotal[0].trading_volume) : 0

        // 24 hrs volume of created nfts
        const sellingVolume24Hrs = await NftSaleLogModel.aggregate([
            { $match: { 'seller.key': userKey, created: { $gte: moment().add(-1, 'days').toDate() } } },
            { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
        ])
        const number_of_selling_orders_24hrs = sellingVolume24Hrs && sellingVolume24Hrs[0] ? sellingVolume24Hrs[0].count : 0
        const trading_volume_of_selling_24hrs = sellingVolume24Hrs && sellingVolume24Hrs[0] ? parseFloat(sellingVolume24Hrs[0].trading_volume) : 0

        const ranking: IUserRanking = {
            user_key: userKey,
            number_of_followers,
            number_of_followings,
            number_of_nft_liked,
            number_of_nft_created,
            number_of_created_nfts_owners,
            number_of_created_nfts_orders,
            trading_volume_of_created_nfts,
            number_of_created_nfts_orders_24hrs,
            trading_volume_of_created_nfts_24hrs,
            number_of_buying_orders,
            trading_volume_of_buying,
            number_of_buying_orders_24hrs,
            trading_volume_of_buying_24hrs,
            number_of_selling_orders,
            trading_volume_of_selling,
            number_of_selling_orders_24hrs,
            trading_volume_of_selling_24hrs,
            updated: new Date()
        }
        const user = await UserModel.findOneAndUpdate(
            { key: userKey },
            {
                $set: { ranking }
            },
            { new: true }
        )
        await new UserRankingModel({
            ...ranking
        }).save()
        return user
    }
}
