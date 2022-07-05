import asyncHandler from '@common/asyncHandler'
import { Request, Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { handleFiles, resizeImages, uploadFiles } from '@middlewares/files.middleware'
import { requireAuth } from '@common/authCheck'
import UserService from './user.service'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import {
    SetupCredentialsDto,
    SetupTotpDto,
    UpdateEmailDto,
    UpdatePhoneDto,
    UpdateProfileDto,
    UpdateSecurityDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto
} from './user.dto'
import { requireAdmin } from '@config/role'
import validationMiddleware from '@middlewares/validation.middleware'
import { IUserQueryFilter } from './user.interface'
import { downloadResource } from '@utils/utility'

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

        this.router.put(`${this.path}/:key/profile`, requireAuth, validationMiddleware(UpdateProfileDto), asyncHandler(this.updateProfile))
        this.router.get(`${this.path}/:key/profile`, requireAuth, asyncHandler(this.getProfile))
        this.router.get(`${this.path}/:name/brief`, asyncHandler(this.getBriefByName)) // public route
        this.router.get(`${this.path}/:key/totp`, requireAuth, asyncHandler(this.getTotp))
        this.router.post(`${this.path}/:key/totp`, requireAuth, validationMiddleware(SetupTotpDto), asyncHandler(this.setTotp))
        this.router.post(`${this.path}/:key/security`, requireAuth, validationMiddleware(UpdateSecurityDto), asyncHandler(this.updateSecurity))
        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.getUserList))

        // TODO - admin can reset password and pin , generate a temp password , then user can reset new password and new pin.
        // - please check https://github.com/pellartech/pellar-federation/blob/xif_develop/server/services/user.service.js#L556
        this.router.post(`${this.path}/:key/credentials/reset`, requireAuth, requireAdmin(), asyncHandler(this.resetCredentials))
        this.router.post(
            `${this.path}/credentials/setup`,
            requireAuth,
            validationMiddleware(SetupCredentialsDto),
            asyncHandler(this.setupCredentials)
        )

        this.router.post(`${this.path}/:key/status/update`, requireAuth, requireAdmin(), asyncHandler(this.updateUserStatus))
        this.router.post(`${this.path}/:key/remove`, requireAuth, requireAdmin(), asyncHandler(this.removeUser))
        this.router.post(`${this.path}/:key/totp/reset`, requireAuth, requireAdmin(), asyncHandler(this.resetTotp))
        this.router.post(`${this.path}/:key/role/update`, requireAuth, requireAdmin(), asyncHandler(this.updateUserRole))
        this.router.post(`${this.path}/:key/phone/update`, requireAuth, asyncHandler(this.updatePhone))
        this.router.post(`${this.path}/:key/email/update`, requireAuth, asyncHandler(this.updateEmail))
        this.router.get(`${this.path}/list/export`, requireAuth, asyncHandler(this.exportAllUser))
    }

    private uploadAvatar = async (req: AuthenticationRequest, res: Response) => {
        const filesUploaded = res.locals.files_uploaded
        const data = await UserService.uploadAvatar(filesUploaded, { req })
        return res.send(data)
    }

    private updateProfile = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const userData: UpdateProfileDto = req.body
        const data = await UserService.updateProfile(key, userData, { req })
        return res.send(data)
    }

    private getProfile = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const data = await UserService.getProfile(key, { req })
        return res.send(data)
    }

    private getBriefByName = async (req: Request, res: Response) => {
        const chatName: string = req.params.name
        const data = await UserService.getBriefByName(chatName)
        return res.send(data)
    }

    private getTotp = async (req: AuthenticationRequest, res: Response) => {
        const data = await UserService.getTotp({ req })
        return res.send(data)
    }

    private setTotp = async (req: AuthenticationRequest, res: Response) => {
        const params: SetupTotpDto = req.body
        const data = await UserService.setTotp(params, { req })
        return res.send(data)
    }

    private updateSecurity = async (req: AuthenticationRequest, res: Response) => {
        const userKey = req.params.key
        const params: UpdateSecurityDto = req.body
        const data = await UserService.updateSecurity(userKey, params, { req })
        return res.send(data)
    }

    private getUserList = async (req: CustomRequest, res: Response) => {
        const filter = req.query as IUserQueryFilter
        const data = await UserService.getUserList(filter)
        return res.send(data)
    }

    private exportAllUser = async (req: CustomRequest, res: Response) => {
        const data = await UserService.getAllUser()
        const fields = [
            { label: 'Key', value: 'key' },
            { label: 'First Name', value: 'firstName' },
            { label: 'Last Name', value: 'lastName' },
            { label: 'Chat Name', value: 'chatName' },
            { label: 'Full Name', value: 'fullName' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Country', value: 'country' },
            { label: 'Avatar', value: 'avatar' },
            { label: 'Status', value: 'status' },
            { label: 'Role', value: 'role' },
            { label: 'Email Verified', value: 'emailVerified' },
            { label: 'Phone Verified', value: 'phoneVerified' },
            { label: 'Removed', value: 'removed' },
            { label: 'KYC Verified', value: 'kycVerified' },
            { label: 'Created', value: 'created' }
        ]

        return downloadResource(res, 'export.csv', fields, data)
    }

    private resetCredentials = async (req: Request, res: Response) => {
        const key: string = req.params.key
        const data = await UserService.resetCredentials(key)
        return res.send(data)
    }

    private setupCredentials = async (req: Request, res: Response) => {
        const params: SetupCredentialsDto = req.body
        const data = await UserService.setupCredentials(params)
        return res.send(data)
    }

    private async updateUserStatus(req: CustomRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateUserStatusDto = req.body
        const data = await UserService.updateUserStatus(userKey, params)
        return res.json(data)
    }

    private async removeUser(req: CustomRequest, res: Response) {
        const userKey = req.params.key
        const data = await UserService.removeUser(userKey)
        return res.json(data)
    }

    private async resetTotp(req: CustomRequest, res: Response) {
        const userKey = req.params.key
        const data = await UserService.resetTotp(userKey)
        return res.json(data)
    }

    private async updateUserRole(req: CustomRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateUserRoleDto = req.body
        const data = await UserService.updateUserRole(userKey, params)
        return res.json(data)
    }

    private async updatePhone(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdatePhoneDto = req.body
        const data = await UserService.updatePhone(userKey, params, { req })
        return res.json(data)
    }

    private async updateEmail(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateEmailDto = req.body
        const data = await UserService.updateEmail(userKey, params, { req })
        return res.json(data)
    }
}

export default UserController
