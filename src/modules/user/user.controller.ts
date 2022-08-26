import asyncHandler from '@utils/asyncHandler'
import { Request, Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { handleFiles } from '@middlewares/files.middleware'
import { requireAuth } from '@utils/authCheck'
import UserService from './user.service'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import {
    AdminUpdateProfileDto,
    CreateUserDto,
    SetupCredentialsDto,
    SetupTotpDto,
    UpdateEmailDto,
    UpdatePhoneDto,
    UpdateProfileDto,
    UpdateSecurityDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto,
    ForgotPasswordDto,
    ForgotPinDto,
    ResetPasswordDto,
    ResetPinDto
} from './user.dto'
import { requireAdmin, requireOwner } from '@config/role'
import validationMiddleware from '@middlewares/validation.middleware'
import { IUserQueryFilter } from './user.interface'
import { downloadResource } from '@utils/utility'
import { USER_AVATAR_SIZES } from '@config/constants'
import Multer from 'multer'

const upload = Multer()

class UserController implements IController {
    public path = '/users'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), asyncHandler(this.register))

        this.router.post(`${this.path}/password/forgot`, validationMiddleware(ForgotPasswordDto), asyncHandler(this.forgotPassword))
        this.router.post(`${this.path}/password/reset`, validationMiddleware(ResetPasswordDto), asyncHandler(this.resetPassword))

        this.router.post(`${this.path}/pin/forgot`, validationMiddleware(ForgotPinDto), asyncHandler(this.forgotPin))
        this.router.post(`${this.path}/pin/reset`, validationMiddleware(ResetPinDto), asyncHandler(this.resetPin))

        this.router.post(`${this.path}/avatar`, requireAuth, upload.any(), asyncHandler(this.uploadAvatar))

        this.router.put(`${this.path}/profile`, requireAuth, validationMiddleware(UpdateProfileDto), asyncHandler(this.updateProfile))
        this.router.get(`${this.path}/:key/profile`, requireAuth, requireOwner('users'), asyncHandler(this.getProfile))
        this.router.get(`${this.path}/:name/brief`, asyncHandler(this.getBriefByName)) // public route
        this.router.get(`${this.path}/:key/totp`, requireAuth, asyncHandler(this.getTotp))
        this.router.post(`${this.path}/:key/totp`, requireAuth, validationMiddleware(SetupTotpDto), asyncHandler(this.setTotp))
        this.router.post(`${this.path}/:key/security`, requireAuth, validationMiddleware(UpdateSecurityDto), asyncHandler(this.updateSecurity))
        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.getUserList))
        this.router.get(`${this.path}/username`, asyncHandler(this.getPublicUserList))

        this.router.put(
            `${this.path}/:key/profile/admin`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(AdminUpdateProfileDto),
            asyncHandler(this.updateProfileByAdmin)
        )

        this.router.post(`${this.path}/:key/credentials/reset`, requireAuth, requireAdmin(), asyncHandler(this.resetCredentials))
        this.router.post(`${this.path}/credentials/setup`, validationMiddleware(SetupCredentialsDto), asyncHandler(this.setupCredentials))

        this.router.post(`${this.path}/:key/status/update`, requireAuth, requireAdmin(), asyncHandler(this.updateUserStatus))
        this.router.post(`${this.path}/:key/remove`, requireAuth, requireAdmin(), asyncHandler(this.removeUser))
        this.router.post(`${this.path}/:key/totp/reset`, requireAuth, requireAdmin(), asyncHandler(this.resetTotp))
        this.router.post(`${this.path}/:key/role/update`, requireAuth, requireAdmin(), asyncHandler(this.updateUserRole))
        this.router.post(`${this.path}/:key/phone/update`, requireAuth, requireOwner('users'), asyncHandler(this.updatePhone))
        this.router.post(`${this.path}/:key/email/update`, requireAuth, requireOwner('users'), asyncHandler(this.updateEmail))
        this.router.get(`${this.path}/list/export`, requireAuth, requireAdmin(), asyncHandler(this.exportAllUser))
    }

    private register = async (req: CustomRequest, res: Response) => {
        const userData: CreateUserDto = req.body
        const data = await UserService.register(userData, { req })

        return res.send(data)
    }

    private forgotPassword = async (req: Request, res: Response) => {
        const params: ForgotPasswordDto = req.body
        const data = await UserService.forgotPassword(params)

        return res.send(data)
    }

    private resetPassword = async (req: AuthenticationRequest, res: Response) => {
        const params: ResetPasswordDto = req.body
        const data = await UserService.resetPassword(params, { req })

        return res.send(data)
    }

    private forgotPin = async (req: AuthenticationRequest, res: Response) => {
        const params: ForgotPinDto = req.body
        const data = await UserService.forgotPin(params)

        return res.send(data)
    }

    private resetPin = async (req: AuthenticationRequest, res: Response) => {
        const params: ResetPinDto = req.body
        const data = await UserService.resetPin(params, { req })

        return res.send(data)
    }

    private uploadAvatar = async (req: AuthenticationRequest, res: Response) => {
        const data = await UserService.uploadAvatar(req.files, { req })
        return res.send(data)
    }

    private updateProfile = async (req: AuthenticationRequest, res: Response) => {
        const userData: UpdateProfileDto = req.body
        const data = await UserService.updateProfile(userData, { req })
        return res.send(data)
    }

    private updateProfileByAdmin = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const userData: AdminUpdateProfileDto = req.body
        const data = await UserService.updateProfileByAdmin(key, userData, { req })
        return res.send(data)
    }

    private getProfile = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const data = await UserService.getProfile(key)
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

    private getPublicUserList = async (req: CustomRequest, res: Response) => {
        const filter = req.query as IUserQueryFilter
        filter.terms = req.query.search
        const data = await UserService.getPublicUserList(filter)
        return res.send(data)
    }

    private exportAllUser = async (req: CustomRequest, res: Response) => {
        const filter = req.query as IUserQueryFilter
        const data = await UserService.getUserList(filter)
        const fields = [
            { label: 'Key', value: 'key' },
            { label: 'First Name', value: 'first_name' },
            { label: 'Last Name', value: 'last_lame' },
            { label: 'Chat Name', value: 'chat_name' },
            { label: 'Full Name', value: 'full_name' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Country', value: 'country' },
            { label: 'Avatar', value: 'avatar' },
            { label: 'Status', value: 'status' },
            { label: 'Role', value: 'role' },
            { label: 'Email Verified', value: 'email_verified' },
            { label: 'Phone Verified', value: 'phone_verified' },
            { label: 'Removed', value: 'removed' },
            { label: 'KYC Verified', value: 'kyc_verified' },
            { label: 'Created', value: 'created' }
        ]

        return downloadResource(res, 'users.csv', fields, data.items ?? data)
    }

    private resetCredentials = async (req: AuthenticationRequest, res: Response) => {
        const key: string = req.params.key
        const data = await UserService.resetCredentials(key, { req })
        return res.send(data)
    }

    private setupCredentials = async (req: AuthenticationRequest, res: Response) => {
        const params: SetupCredentialsDto = req.body
        const data = await UserService.setupCredentials(params, { req })
        return res.send(data)
    }

    private async updateUserStatus(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateUserStatusDto = req.body
        const data = await UserService.updateUserStatus(userKey, params, { req })
        return res.json(data)
    }

    private async removeUser(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const data = await UserService.removeUser(userKey, { req })
        return res.json(data)
    }

    private async resetTotp(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const data = await UserService.resetTotp(userKey, { req })
        return res.json(data)
    }

    private async updateUserRole(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateUserRoleDto = req.body
        const data = await UserService.updateUserRole(userKey, params, { req })
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
