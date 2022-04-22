import asyncHandler from '@common/asyncHandler'
import { Request, Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { handleFiles, resizeImages, uploadFiles } from '@middlewares/files.middleware'
import { requireAuth } from '@common/authCheck'
import UserService from './user.service'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { UpdateUserDto } from './user.dto'
// import validationMiddleware from '../../middlewares/validation.middleware'

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

        this.router.post(`${this.path}/info`, requireAuth, asyncHandler(this.updateUser))

        this.router.get(`${this.path}/info/@:nickName`, asyncHandler(this.getUserByKey))
        // this.router.get(`${this.path}`, asyncHandler(this.queryAccounts));
    }

    private uploadAvatar = async (req: AuthenticationRequest, res: Response) => {
        const filesUploaded = res.locals.files_uploaded
        const data = await UserService.uploadAvatar(filesUploaded, { req })
        return res.send(data)
    }

    private updateUser = async (req: AuthenticationRequest, res: Response) => {
        const userData: UpdateUserDto = req.body
        const data = await UserService.updateUser(userData, { req })
        return res.send(data)
    }

    private getUserByKey = async (req: Request, res: Response) => {
        const nickName: string = req.params.nickName
        const data = await UserService.getUserByNickname(nickName)
        return res.send(data)
    }
}

export default UserController
