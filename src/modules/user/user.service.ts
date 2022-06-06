import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { IFileUploaded } from '@interfaces/files.upload.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { forEach } from 'lodash'
import { GetUserListDto, UpdateMFADto, UpdateUserDto } from './user.dto'
import UserModel from './user.model'
import { generateTotpToken, verifyTotpToken } from '@common/twoFactor'
import sendEmail from '@common/email'
import { MFAType } from '@modules/auth/auth.interface'
import * as bcrypt from 'bcrypt'
import { unixTimestampToDate } from '@utils/utility'
import { IUser } from '@modules/user/user.interface'
import { QueryRO } from '@interfaces/query.model'
import VerificationCodeService from '@modules/verification_code/code.service'
import { CodeType } from '@modules/verification_code/code.interface'

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

    public static updateUser = async (data: UpdateUserDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ email: options?.req?.user?.email }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }

        const filter = {
            $or: [{ email: data.email }, { phone: data.phone }, { nickName: data.nickName }]
        }
        const existUser = await UserModel.findOne(filter).exec()
        if (existUser && existUser.key !== user.key) {
            const duplicateInfo = {
                email: existUser.email === user.email ? existUser.email : '',
                phone: existUser.phone === user.phone ? existUser.phone : '',
                nickName: existUser.nickName === user.nickName ? existUser.nickName : ''
            }
            throw new BizException(AuthErrors.registration_info_exists_error, new ErrorContext('user.service', 'updateUser', duplicateInfo))
        }
        if (data.email && data.email !== user.email) {
            await this.verifyNewEmail(data)
        }
        if (data.phone && data.phone !== user.phone) {
            await this.verifyNewPhone(data)
        }
        user?.set('email', data.email.toLowerCase() || user.email, String)
        user?.set('firstName', data.firstName || user.firstName, String)
        user?.set('lastName', data.lastName || user.lastName, String)
        user?.set('nickName', data.nickName || user.nickName, String)
        user?.set('phone', data.phone || user.phone, String)
        user?.set('country', data.country || user.country, String)
        user?.set('playerId', data.playerId || user.playerId, String)
        user?.save()

        return user
    }

    public static getUserByNickname = async (nickName: string) => {
        return await UserModel.findOne({ nickName: { $regex: nickName, $options: 'i' } }).exec()
    }

    static createCreateTransaction = async (transactionParams: any) => {
        throw new BizException(
            { message: 'Not implemented.', status: 400, code: 400 },
            new ErrorContext('transaction.service', 'createCreateTransaction', {})
        )
    }

    static getTransactionById = async (id: string) => {
        throw new BizException(
            { message: 'Not implemented.', status: 400, code: 400 },
            new ErrorContext('transaction.service', 'getTransactionById', {})
        )
    }

    public static generateTwoFactorUser = async (options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ email: options?.req?.user?.email }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        let twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
        if (!twoFactorSecret) {
            const speakeasy = require('speakeasy')
            const secret = speakeasy.generateSecret({ length: 20 })
            user.set('twoFactorSecret', secret.base32)
            user.save()
            twoFactorSecret = secret.base32
        }
        const token = generateTotpToken(twoFactorSecret)
        const subject = 'Welcome to LightLink'
        const text = ''
        const html = `This is the verification code you requested: <b>${token}</b>`

        await sendEmail(subject, text, html, user.email)

        if (process.env.NODE_ENV === 'development') {
            return { secret: twoFactorSecret, token: token }
        }
        return { secret: twoFactorSecret }
    }

    public static updateMFA = async (data: UpdateMFADto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ email: options?.req?.user?.email }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        switch (data.MFAType) {
        case MFAType.PIN:
            const pinHash = await bcrypt.hash(data.token, 10)
            user?.set('pin', pinHash || user.pin, String)
            break
        case MFAType.TOTP:
            const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
            if (!verifyTotpToken(twoFactorSecret, data.token)) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('user.service', 'updateUser', {}))
            }
            break
        case MFAType.SMS:
            break
        }
        const MFASettings:any = user.MFASettings
        MFASettings.MFAType = data.MFAType
        user?.set('MFASettings', MFASettings, Object)
        user?.save()

        return user
    }

    public static getUserList = async (params: GetUserListDto) => {
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

    public static verifyNewEmail = async (data: UpdateUserDto) => {
        const { success } = await VerificationCodeService.verifyCode({
            codeType: CodeType.EmailUpdate,
            owner: data.email,
            code: data.newEmailCode
        })
        if (!success) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('auth.service', 'updateUser', { email: data.email })
            )
        }
    }

    public static verifyNewPhone = async (data: UpdateUserDto) => {
        const { success } = await VerificationCodeService.verifyCode({
            codeType: CodeType.PhoneUpdate,
            owner: data.phone,
            code: data.newPhoneCode
        })
        if (!success) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('auth.service', 'updateUser', { phone: data.phone })
            )
        }
    }
}
