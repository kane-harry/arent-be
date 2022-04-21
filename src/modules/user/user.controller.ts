import asyncHandler from '@common/asyncHandler'
import { Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { handleFiles, resizeImages, uploadFiles } from '@middlewares/files.middleware'
import { requireAuth } from '@common/authCheck'
import UserService from './user.service'
import { AuthenticationRequest } from '@middlewares/request.middleware'
// import validationMiddleware from '../../middlewares/validation.middleware'
// import { CreateUserDto } from './user.dto'
// import { IUser, IUserFilter } from './user.interface'
// import UserService from './user.service'
// import { CustomRequest } from '../../middlewares/request.middleware'

class UserController implements IController {
    public path = '/users'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(
            `${this.path}/avatar`,
            requireAuth,
            asyncHandler(handleFiles([{ name: 'avatar', maxCount: 1 }])),
            asyncHandler(
                resizeImages({
                    avatar: [
                        { maxSize: 1280, id: 'lg' },
                        { maxSize: 600, id: 'sm' },
                        { maxSize: 80, id: 'mini' }
                    ]
                })
            ),
            asyncHandler(uploadFiles('avatar')),
            asyncHandler(this.uploadAvatar)
        )
        // this.router.get(`${this.path}/:address`, asyncHandler(this.getAccount));
        // this.router.get(`${this.path}`, asyncHandler(this.queryAccounts));
    }

    private uploadAvatar = async (req: AuthenticationRequest, res: Response) => {
        const filesUploaded = res.locals.files_uploaded
        const data = UserService.uploadAvatar(filesUploaded, req.user, { req })
        return res.send(data)
    }

    // private getAccount = async (req: Request, res: Response, next: NextFunction) => {
    //     const address = req.params.address;
    //     const data = await UserService.getAccount(address)
    //     return res.send(data);

    // }
    // private queryAccounts = async (req: CustomRequest, res: Response, next: NextFunction) => {
    //     const filter = req.query as IUserFilter
    //     const data = await UserService.queryAccounts(filter)
    //     return res.send(data);
    // }
}

export default UserController
