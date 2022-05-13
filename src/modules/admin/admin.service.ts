import { AuthErrors } from '@exceptions/custom.error'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { LockUserDto } from '@modules/admin/admin.dto'
import UserModel from '@modules/user/user.model'

export default class AdminService {
    static async lockUser(params: LockUserDto) {
        const user = await UserModel.findOne({ key: params.userKey }).exec()

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('admin.service', 'lockUser', {}))
        }

        user?.set('status', params.userStatus, String)
        user?.save()

        return user
    }
}
