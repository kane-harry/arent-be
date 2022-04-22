import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { IFileUploaded } from '@interfaces/files.upload.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { forEach } from 'lodash'
import { UpdateUserDto } from './user.dto'
import UserModel from './user.model'

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
}
