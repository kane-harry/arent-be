import asyncHandler from '@common/asyncHandler'
import { Request, Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { handleFiles, resizeImages, uploadFiles } from '@middlewares/files.middleware'
import { requireAuth } from '@common/authCheck'
import UserService from './user.service'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { GetUserListDto, UpdateMFADto, UpdateUserDto } from './user.dto'
import { IAccountFilter } from '@modules/account/account.interface'
import { requireAdmin } from '@config/role'

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

        this.router.get(`${this.path}/info/:nickName`, asyncHandler(this.getPublicUserByNickName))

        this.router.post(`${this.path}/totp/generate`, requireAuth, asyncHandler(this.generateTotp))
        this.router.post(`${this.path}/:key/mfa`, requireAuth, asyncHandler(this.updateMFA))
        this.router.get(`${this.path}/list`, requireAuth, requireAdmin(), asyncHandler(this.getUserList))
        this.router.get(`${this.path}/me`, requireAuth, asyncHandler(this.getMyProfile))
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

    private getPublicUserByNickName = async (req: Request, res: Response) => {
        const nickName: string = req.params.nickName
        const data = await UserService.getUserByNickname(nickName)
        const resData = {
            key: data?.key,
            firstName: data?.firstName,
            lastName: data?.lastName,
            nickName: data?.nickName,
            country: data?.country,
            avatar: data?.avatar,
            status: data?.status
        }
        return res.send(resData)
    }

    private getMyProfile = async (req: Request, res: Response) => {
        return res.send(req?.user)
    }

    private generateTotp = async (req: AuthenticationRequest, res: Response) => {
        const data = await UserService.generateTotp({ req })
        return res.send(data)
    }

    private updateMFA = async (req: AuthenticationRequest, res: Response) => {
        const userKey = req.params.key
        const userData: UpdateMFADto = req.body
        const data = await UserService.updateMFA(userKey, userData, { req })
        return res.send(data)
    }

    private getUserList = async (req: CustomRequest, res: Response) => {
        const filter = req.query as GetUserListDto
        const data = await UserService.getUserList(filter)
        return res.send(data)
    }
}

export default UserController
