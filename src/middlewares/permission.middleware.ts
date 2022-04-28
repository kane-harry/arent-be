import { IUser } from '@app/modules/user/user.interface'
import { CommonErrors } from '@exceptions/custom.error'
import RequestException from '@exceptions/request.exception'
import { RequestHandler } from 'express'
import { find } from 'lodash'

export default (): RequestHandler => {
    return (req, _, next) => {
        if (!req.user) {
            return next(new RequestException(CommonErrors.request_forbidden_error))
        }

        const user = req.user as IUser
        const permissions = user?.permissions
        if (permissions && permissions.length) {
            if (
                !find(permissions, el => {
                    return (
                        String(el.resource).toLowerCase() === String(req.route.path).toLowerCase() &&
                        String(el.action).toLowerCase() === String(req.method).toLowerCase()
                    )
                })
            ) {
                return next(new RequestException(CommonErrors.request_forbidden_error))
            }
        }
        return next()
    }
}
