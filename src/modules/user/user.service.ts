import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { IFileUploaded } from '@interfaces/files.upload.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { UserActions } from '@modules/user_logs/user_log.interface'
import UserLogModel from '@modules/user_logs/user_log.model'
import { forEach } from 'lodash'
import { UserDto } from './user.dto'
import UserModel from './user.model'

export default class UserService {
    public static uploadAvatar = async (filesUploaded: IFileUploaded[], _user: UserDto | undefined, options?: { req: AuthenticationRequest }) => {
        const user = await UserModel.findOne({ email: _user?.email }).exec()
        // TODO: store files uploaded
        let avatars: { [key: string]: string } = {}
        forEach(filesUploaded, file => {
            avatars = {
                ...avatars,
                [file.type]: file.key
            }
        })

        user?.set('avatar', avatars, Object)
        user?.save()

        new UserLogModel({
            action: UserActions.UpdateAvatar,
            agent: options?.req.agent,
            ip_address: options?.req.ip_address,
            old_data: {
                avatar: user?.avatar
            },
            new_data: {
                avatar: avatars
            }
        }).save()
        return user
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
