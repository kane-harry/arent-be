import BizException from '@exceptions/biz.exception'
import { AuthErrors, CommonErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { IFileUploaded } from '@interfaces/files.upload.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { forEach, toLower, escapeRegExp, filter as lodashFilter, trim } from 'lodash'
import {
    AdminUpdateProfileDto,
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
import { AuthTokenType, MFAType } from '@modules/auth/auth.interface'
import * as bcrypt from 'bcrypt'
import { unixTimestampToDate, generateRandomCode, generateUnixTimestamp, randomCode } from '@utils/utility'
import { IUser, IUserQueryFilter, UserStatus } from '@modules/user/user.interface'
import { QueryRO } from '@interfaces/query.model'
import { getNewSecret, verifyNewDevice } from '@utils/totp'
import { CodeType } from '@modules/verification_code/code.interface'
import { stripPhoneNumber } from '@utils/phone-helper'
import VerificationCodeService from '@modules/verification_code/code.service'
import sendSms from '@utils/sms'
import AuthService from '@modules/auth/auth.service'
import EmailService from '@modules/emaill/email.service'
import UserHistoryModel from '@modules/user_history/user_history.model'
import { UserHistoryActions } from '@modules/user_history/user_history.interface'
import AdminLogModel from '@modules/admin_logs/admin_log.model'
import crypto from 'crypto'
import { AdminLogsActions, AdminLogsSections } from '@modules/admin_logs/admin_log.interface'
import { role } from '@config/role'

export default class UserService {
    public static uploadAvatar = async (filesUploaded: IFileUploaded[], options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ email: options.req.user?.email }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'uploadAvatar', {}))
        }

        let avatars: { [key: string]: string } = {}
        forEach(filesUploaded, file => {
            avatars = {
                ...avatars,
                [file.type]: file.key
            }
        })

        user?.set('avatar', avatars, Object)
        user?.save()
        return avatars
    }

    public static updateProfile = async (params: UpdateProfileDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key: options.req.user.key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        const postChatName = trim(toLower(params.chatName))
        const preChatName = trim(toLower(user.chatName))
        if (preChatName !== postChatName) {
            const existUser = await UserModel.findOne({ chatName: new RegExp(postChatName, 'i'), removed: false }).exec()
            if (existUser) {
                throw new BizException(
                    AuthErrors.registration_chatname_exist_error,
                    new ErrorContext('user.service', 'updateProfile', { chatName: postChatName })
                )
            }
        }

        // create log
        new UserHistoryModel({
            key: crypto.randomBytes(16).toString('hex'),
            userKey: user.key,
            action: UserHistoryActions.UpdateProfile,
            agent: options?.req.agent,
            country: user.country,
            ipAddress: options?.req.ip_address,
            preData: {
                firstName: user.firstName,
                lastName: user.lastName,
                chatName: user.chatName
            },
            postData: {
                firstName: params.firstName,
                lastName: params.lastName,
                chatName: params.chatName
            }
        }).save()

        // save
        user.set('firstName', params.firstName || user.firstName, String)
        user.set('lastName', params.lastName || user.lastName, String)
        user.set('chatName', params.chatName || user.chatName, String)
        user.save()

        return user
    }

    public static updateProfileByAdmin = async (key: string, params: AdminUpdateProfileDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        const postChatName = trim(toLower(params.chatName))
        const preChatName = trim(toLower(user.chatName))
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
        new AdminLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            userKey: user.key,
            action: AdminLogsActions.UpdateUser,
            section: AdminLogsSections.User,
            preData: {
                firstName: user.firstName,
                lastName: user.lastName,
                chatName: user.chatName,
                phone: user.phone,
                email: user.email
            },
            postData: {
                firstName: params.firstName,
                lastName: params.lastName,
                chatName: params.chatName,
                phone: phone || user.phone,
                email: email || user.email
            }
        }).save()

        // save
        user.set('firstName', params.firstName || user.firstName, String)
        user.set('lastName', params.lastName || user.lastName, String)
        user.set('chatName', params.chatName || user.chatName, String)
        user.set('phone', phone || user.phone, String)
        user.set('email', email || user.email, String)
        user.save()

        return user
    }

    public static getProfile = async (key: string, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'getProfile', {}))
        }
        // check permissions
        if (options.req.user.role !== role.admin.id && options.req.user.key !== user.key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('user.service', 'getProfile', { key: key }))
        }
        return user
    }

    public static getBriefByName = async (chatName: string) => {
        return await UserModel.findOne({ chatName: chatName }).select('key firstName lastName email chatName country').exec()
    }

    public static getTotp = async (options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key: options?.req?.user?.key }).exec()
        const totpTemp = await getNewSecret()
        user?.set('totpTempSecret', totpTemp.secret)
        user?.save()
        return { totpTemp: totpTemp }
    }

    public static setTotp = async (params: SetupTotpDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key: options?.req?.user?.key }).select('key totpTempSecret').exec()
        const secret = user?.totpTempSecret
        const verified = await verifyNewDevice(secret, params.token1, params.token2)
        if (!verified) {
            throw new BizException(AuthErrors.user_token_setup_error, new ErrorContext('user.service', 'updateProfile', { email: user?.email }))
        }
        user?.set('totpTempSecret', null)
        user?.set('totpSecret', secret)
        user?.set('totpSetup', true)
        user?.set('mfaSettings.type', MFAType.TOTP)
        user?.save()
        return user
    }

    public static updateSecurity = async (key: string, params: UpdateSecurityDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateSecurity', {}))
        }
        // Check permission
        if (user.key !== options?.req?.user?.key && options.req.user.role !== role.admin.id) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('user.service', 'updateSecurity', {}))
        }
        const type = params.type.toUpperCase()
        const loginEnabled = params.loginEnabled.toLowerCase() === 'true'
        const withdrawEnabled = params.withdrawEnabled.toLowerCase() === 'true'

        // create log
        new UserHistoryModel({
            key: crypto.randomBytes(16).toString('hex'),
            userKey: user.key,
            action: UserHistoryActions.UpdateSecurity,
            agent: options?.req.agent,
            country: user.country,
            ipAddress: options?.req.ip_address,
            preData: {
                mfaSettings: user.mfaSettings
            },
            postData: {
                mfaSettings: {
                    type,
                    loginEnabled,
                    withdrawEnabled
                }
            }
        }).save()

        user.set('mfaSettings', {
            type,
            loginEnabled,
            withdrawEnabled
        })
        user?.save()
        return user
    }

    public static getUserList = async (params: IUserQueryFilter) => {
        const offset = (params.pageindex - 1) * params.pagesize
        const reg = new RegExp(params.terms)
        const filter = {
            $or: [{ key: reg }, { email: reg }, { phone: reg }],
            $and: [{ created: { $exists: true } }]
        }
        if (params.datefrom) {
            const dateFrom = unixTimestampToDate(params.datefrom)
            // @ts-ignore
            filter.$and.push({ created: { $gte: dateFrom } })
        }
        if (params.dateto) {
            const dateTo = unixTimestampToDate(params.dateto)
            // @ts-ignore
            filter.$and.push({ created: { $lt: dateTo } })
        }
        const sorting: any = { _id: 1 }
        if (params.sortby) {
            delete sorting._id
            sorting[`${params.sortby}`] = params.orderby === 'asc' ? 1 : -1
        }
        const totalCount = await UserModel.countDocuments(filter)
        const items = await UserModel.find<IUser>(filter).sort(sorting).skip(offset).limit(params.pagesize).exec()
        return new QueryRO<IUser>(totalCount, params.pageindex, params.pagesize, items)
    }

    public static getAllUser = async () => {
        const items = await UserModel.find<IUser>().exec()
        return items
    }

    public static async generateRandomName(name: string) {
        name = toLower(escapeRegExp(name))
        let name_arr: any = name.split(' ')
        name_arr = lodashFilter(name_arr, function (o) {
            if (o.trim().length > 0) {
                return o
            }
        })
        let newName = name_arr.join('-')
        let reg = new RegExp(name, 'i')
        const filter = { chatName: reg }
        let referenceInDatabase = await UserModel.findOne(filter).select('key chatName').exec()

        while (referenceInDatabase != null) {
            const proposedReference = generateRandomCode(2, 4, true)
            newName = newName + '-' + proposedReference
            reg = new RegExp(newName, 'i')
            filter.chatName = reg
            referenceInDatabase = await UserModel.findOne(filter).select('key chatName').exec()
        }
        return newName
    }

    public static async resetCredentials(key: string, options: { req: AuthenticationRequest }) {
        const user = await UserModel.findOne({ key }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        new AdminLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            userKey: user.key,
            action: AdminLogsActions.ResetCredentialsUser,
            section: AdminLogsSections.User
        }).save()

        const changePasswordNextLoginCode = randomCode(true, 8, 8)
        const changePasswordNextLoginTimestamp = generateUnixTimestamp()
        user.set('changePasswordNextLogin', true)
        user.set('changePasswordNextLoginCode', changePasswordNextLoginCode)
        user.set('changePasswordNextLoginTimestamp', changePasswordNextLoginTimestamp)
        user.set('tokenVersion', changePasswordNextLoginTimestamp)
        user.set('mfaSettings.loginEnabled', false) // TODO : works ?
        user.set('loginCount', 0)
        user.set('lockedTimestamp', 0)
        user.save()

        if (user.email) {
            await EmailService.sendResetCredentialsComplete({ address: user.email, code: changePasswordNextLoginCode })
        } else if (user.phone) {
            const text = `Your acount has been reset, please use ${changePasswordNextLoginCode} as your password to log in within the next 15 minutes.`
            await sendSms('Reset credentials', text, text, user.phone)
        }

        return { success: true }
    }

    public static async setupCredentials(params: SetupCredentialsDto) {
        const email = toLower(trim(params.email))
        const user = await UserModel.findOne({ email }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        if (!user.changePasswordNextLogin || user.changePasswordNextLogin !== true) {
            throw new BizException(CommonErrors.bad_request, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        let changePasswordNextLoginAttempts = user.changePasswordNextLoginAttempts || 0
        if (changePasswordNextLoginAttempts >= 5) {
            user.set('status', UserStatus.Locked, String)
            user.save()
            throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'setupCredentials', { email }))
        }
        const currentTimestamp = generateUnixTimestamp()
        changePasswordNextLoginAttempts++
        user.set('changePasswordNextLoginAttempts', changePasswordNextLoginAttempts, Number)
        user.save()

        if (
            !user.changePasswordNextLoginCode ||
            toLower(user.changePasswordNextLoginCode.toLowerCase()) !== toLower(params.code) ||
            user.changePasswordNextLoginTimestamp < currentTimestamp - 60 * 15
        ) {
            throw new BizException(
                AuthErrors.user_reset_credentials_incorrect_code_error,
                new ErrorContext('user.service', 'setupCredentials', { email })
            )
        }
        const newPassHashed = await bcrypt.hash(params.password, 10)
        user.set('password', newPassHashed, String)

        const newPinHashed = await bcrypt.hash(params.pin, 10)
        user.set('pin', newPinHashed, String)
        user.set('changePasswordNextLogin', false)
        user.set('changePasswordNextLoginCode', '')
        user.set('changePasswordNextLoginTimestamp', 0)
        user.set('loginCount', 0)
        user.set('lockedTimestamp', 0)
        user.save()

        if (user.email) {
            await EmailService.sendSetupCredentialsComplete({ address: user.email })
        } else if (user.phone) {
            const text = 'Your credentials have been setup'
            await sendSms('Reset credentials', text, text, user.phone)
        }

        return { success: true }
    }

    static async updateUserStatus(userKey: string, params: UpdateUserStatusDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'lockUser', {}))
        }

        // create log
        new AdminLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            userKey: user.key,
            action: params.status + 'User',
            section: AdminLogsSections.User,
            preData: {
                status: user.status
            },
            postData: {
                status: params.status
            }
        }).save()

        user?.set('status', params.status, String)
        user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return user
    }

    static async removeUser(userKey: string, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'removeUser', {}))
        }

        // create log
        new AdminLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            userKey: user.key,
            action: AdminLogsActions.RemoveUser,
            section: AdminLogsSections.User,
            preData: {
                removed: user.removed
            },
            postData: {
                removed: true
            }
        }).save()

        user?.set('removed', true, Boolean)
        user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return user
    }

    static async resetTotp(userKey: string, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'resetTotp', {}))
        }
        if (user.mfaSettings.type === MFAType.TOTP) {
            user?.set('mfaSettings.type', MFAType.EMAIL, String)
        }

        // create log
        new AdminLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            userKey: user.key,
            action: AdminLogsActions.ResetTOPTUser,
            section: AdminLogsSections.User,
            preData: {
                totpSecret: user.totpSecret,
                totpSetup: user.totpSetup
            },
            postData: {
                totpSecret: null,
                totpSetup: false
            }
        }).save()

        user?.set('totpSecret', null, null)
        user?.set('totpSetup', false, Boolean)
        user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return user
    }

    static async updateUserRole(userKey: string, params: UpdateUserRoleDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUserRole', {}))
        }

        // create log
        new AdminLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            userKey: user.key,
            action: AdminLogsActions.UpdateRoleUser,
            section: AdminLogsSections.User,
            preData: {
                role: user.role
            },
            postData: {
                role: Number(params.role)
            }
        }).save()

        user?.set('role', Number(params.role), Number)
        user?.save()
        await AuthService.updateTokenVersion(userKey, currentTimestamp)

        return user
    }

    static async updatePhone(userKey: string, params: UpdatePhoneDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updatePhone', {}))
        }

        const phone = await stripPhoneNumber(params.phone)
        // check phone is available
        const existingUser = await UserModel.findOne({ phone, removed: false }).exec()
        if (existingUser && existingUser.key !== user.key) {
            throw new BizException(AuthErrors.registration_phone_exists_error, new ErrorContext('user.service', 'updatePhone', {}))
        }
        await VerificationCodeService.verifyCode({ code: params.code, codeType: CodeType.PhoneUpdate, owner: phone })

        // create log
        new UserHistoryModel({
            key: crypto.randomBytes(16).toString('hex'),
            userKey: user.key,
            action: UserHistoryActions.UpdatePhone,
            agent: options?.req.agent,
            country: user.country,
            ipAddress: options?.req.ip_address,
            preData: {
                phone: user.phone
            },
            postData: {
                phone: phone
            }
        }).save()

        // save
        user?.set('phone', phone, String)
        user?.save()

        // logout & send sms notifications
        const subject = 'Welcome to LightLink'
        const html = 'You have successfully updated your phone!'
        await sendSms(subject, html, html, phone)
        await AuthService.updateTokenVersion(userKey, currentTimestamp)
        return { success: true }
    }

    static async updateEmail(userKey: string, params: UpdateEmailDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateEmail', {}))
        }
        const email = trim(toLower(params.email))
        const existingUser = await UserModel.findOne({ email, removed: false }).exec()
        if (existingUser && existingUser.key !== user.key) {
            throw new BizException(AuthErrors.registration_email_exists_error, new ErrorContext('user.service', 'updateEmail', { email }))
        }
        await VerificationCodeService.verifyCode({ code: params.code, codeType: CodeType.EmailUpdate, owner: email })

        // create log
        new UserHistoryModel({
            key: crypto.randomBytes(16).toString('hex'),
            userKey: user.key,
            action: UserHistoryActions.UpdateEmail,
            agent: options?.req.agent,
            country: user.country,
            ipAddress: options?.req.ip_address,
            preData: {
                email: user.email
            },
            postData: {
                email: email
            }
        }).save()

        // save
        user?.set('email', email, String)
        user?.save()

        // logout & send email notifications
        await EmailService.sendEmailUpdateComplete({ address: email })
        await AuthService.updateTokenVersion(userKey, currentTimestamp)
        return { success: true }
    }
}
