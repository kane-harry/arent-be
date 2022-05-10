import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { IFileUploaded } from '@interfaces/files.upload.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { forEach } from 'lodash'
import {GetUserListDto, Update2FAUserDto, UpdateUserDto} from './user.dto'
import UserModel from './user.model'
import { generateTotpToken, verifyTotpToken } from '@common/twoFactor'
import sendEmail from '@common/email'
import { TwoFactorType } from '@modules/auth/auth.interface'
import * as bcrypt from 'bcrypt'
import {unixTimestampToDate} from "@utils/utility";
import {IUser} from "@modules/user/user.interface";
import {QueryRO} from "@interfaces/query.model";

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
        return await UserModel.findOne({ nickName }).exec()
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
        if (!user.twoFactorSecret) {
            const speakeasy = require('speakeasy')
            const secret = speakeasy.generateSecret({ length: 20 })
            user.set('twoFactorSecret', secret.base32)
            user.save()
        }
        const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
        const token = generateTotpToken(twoFactorSecret)
        const subject = 'Welcome to LightLink'
        const text = ''
        const html = `This is the verification code you requested: <b>${token}</b>`

        await sendEmail(subject, text, html, user.email)

        return user
    }

    public static updateTwoFactorUser = async (data: Update2FAUserDto, options: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ email: options?.req?.user?.email }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.service', 'updateUser', {}))
        }
        switch (data.twoFactorEnable) {
            case TwoFactorType.PIN:
                const pinHash = await bcrypt.hash(data.token, 10)
                user?.set('twoFactorEnable', TwoFactorType.PIN, String)
                user?.set('pin', pinHash || user.pin, String)
                break
            case TwoFactorType.TOTP:
                const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
                if (!verifyTotpToken(twoFactorSecret, data.token)) {
                    throw new BizException(AuthErrors.token_error, new ErrorContext('user.service', 'updateUser', {}))
                }
                user?.set('twoFactorEnable', TwoFactorType.TOTP, String)
                break
            case TwoFactorType.SMS:
                user?.set('twoFactorEnable', TwoFactorType.SMS, String)
                break
        }
        user?.save()

        return user
    }

    public static getUserList = async (params: GetUserListDto) => {
        const offset = (params.pageindex - 1) * params.pagesize
        const reg = new RegExp(params.terms)
        let filter = {
            $or: [{ key: reg }, { email: reg }, { phone: reg }],
            $and: [{ created: { $exists: true } }],
        };
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
}
