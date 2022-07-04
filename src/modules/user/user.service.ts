import BizException from '@exceptions/biz.exception'
import { AuthErrors, CommonErrors, VerificationCodeErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { IFileUploaded } from '@interfaces/files.upload.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { forEach, toLower, escapeRegExp, filter as lodashFilter, trim } from 'lodash'
import { LockUserDto, SetupCredentialsDto, SetupTotpDto, UpdateProfileDto, UpdateSecurityDto } from './user.dto'
import UserModel from './user.model'
import sendEmail from '@common/email'
import { MFAType } from '@modules/auth/auth.interface'
import * as bcrypt from 'bcrypt'
import { unixTimestampToDate, generateRandomCode } from '@utils/utility'
import { IUser, IUserQueryFilter, UserStatus } from '@modules/user/user.interface'
import { QueryRO } from '@interfaces/query.model'
import VerificationCodeService from '@modules/verification_code/code.service'
import { CodeType } from '@modules/verification_code/code.interface'
import { getPhoneInfo } from '@common/phone-helper'
import { isAdmin } from '@config/role'
import { generateUnixTimestamp, randomCode } from '@common/utility'
import { getNewSecret, verifyNewDevice } from '@utils/totp'

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

    public static updateProfile = async (key: string, params: UpdateProfileDto, options: { req: AuthenticationRequest }) => {
        // TODO - check role - admin can update user's profile , user can update himself only
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        const postChatName = trim(toLower(params.chatName))
        const preChatName = user.chatName
        if (preChatName !== postChatName) {
            const existUser = await UserModel.findOne({ chatName: postChatName }).exec()
            if (existUser) {
                throw new BizException(
                    AuthErrors.registration_chatname_exist_error,
                    new ErrorContext('user.service', 'updateProfile', { chatName: postChatName })
                )
            }
        }
        user.set('firstName', params.firstName || user.firstName, String)
        user.set('lastName', params.lastName || user.lastName, String)
        user.set('chatName', params.chatName || user.chatName, String)
        user.save()
        return user
    }

    public static getProfile = async (key: string, options: { req: AuthenticationRequest }) => {
        // TODO -  check permissions - user A can't get user B's profile, admin can get all fields
        // for public info - call getBriefByName
        const user = await UserModel.findOne({ key }).exec()
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
        // Check permission, only user can update this
        if (user.key !== options?.req?.user?.key) {
            // TODO - return 401 ?
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateSecurity', {}))
        }
        // TODO  - please check this logic in XIF

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

    public static async resetCredentials(key: string) {
        const user = await UserModel.findOne({ key }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        const changePasswordNextLoginCode = randomCode(true, 8, 8)
        const changePasswordNextLoginTimestamp = generateUnixTimestamp()
        user.set('changePasswordNextLogin', true)
        user.set('changePasswordNextLoginCode', changePasswordNextLoginCode)
        user.set('changePasswordNextLoginTimestamp', changePasswordNextLoginTimestamp)
        user.set('mfaSettings.loginEnabled', false) // TODO : works ?
        user.set('loginCount', 0)
        user.set('lockedTimestamp', 0)
        user.save()

        // TODO - send code to user via email and phone
        // Pseudocode
        // if(user.email){
        //     emailService.sendResetCredentialsNotificationEmail(context)
        // }else if (user.phone) {
        //     sms.send(sms_subject, sms_content, phone)
        // }

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

        // TODO - send code to user via email and phone
        // Pseudocode
        // if(user.email){
        //     emailService.sendResetCredentialsNotificationEmail(context)
        // }else if (user.phone) {
        //     sms.send(sms_subject, sms_content, phone)
        // }

        return { success: true }
    }

    static async lockUser(userKey: string, params: LockUserDto) {
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'lockUser', {}))
        }

        user?.set('status', params.userStatus, String)
        user?.save()

        return user
    }

    static async removeUser(userKey: string) {
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'removeUser', {}))
        }

        user?.set('removed', true, Boolean)
        user?.save()

        return user
    }

    static async resetTotp(userKey: string) {
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'resetTotp', {}))
        }

        user?.set('twoFactorSecret', null, null)
        user?.save()

        return user
    }

    static async updateUserRole(userKey: string) {
        const user = await UserModel.findOne({ key: userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUserRole', {}))
        }

        user?.set('role', 999, null)
        user?.save()

        return user
    }
}
