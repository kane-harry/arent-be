import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import { requireAuth } from '@utils/authCheck'
import {
    AdminUpdateProfileDto,
    AuthorizeDto,
    CreateUserDto,
    EmailVerifyDto,
    ForgotPasswordDto,
    ForgotPinDto,
    ResetPasswordDto,
    ResetPinDto,
    SetupCredentialsDto,
    SetupTotpDto,
    UpdateEmailDto,
    UpdatePhoneDto,
    UpdateProfileDto,
    UpdateSecurityDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto
} from './user.dto'
import { requireAdmin, requireOwner } from '@config/role'
import validationMiddleware from '@middlewares/validation.middleware'
import Multer from 'multer'
import { CreateUserAuthCodeDto } from '@modules/user_auth_code/user_auth_code.dto'
import ICustomRouter from '@interfaces/custom.router.interface'
import UserController from './user.controller'

const upload = Multer()

class UserRouter implements ICustomRouter {
    public path = '/users'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}/code`, validationMiddleware(CreateUserAuthCodeDto), asyncHandler(UserController.getUserAuthCode))
        this.router.post(`${this.path}/auth`, validationMiddleware(AuthorizeDto), asyncHandler(UserController.authorize))
        this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), asyncHandler(UserController.register))

        this.router.post(`${this.path}/password/forgot`, validationMiddleware(ForgotPasswordDto), asyncHandler(UserController.forgotPassword))
        this.router.post(`${this.path}/password/reset`, validationMiddleware(ResetPasswordDto), asyncHandler(UserController.resetPassword))

        this.router.post(`${this.path}/pin/forgot`, validationMiddleware(ForgotPinDto), asyncHandler(UserController.forgotPin))
        this.router.post(`${this.path}/pin/reset`, validationMiddleware(ResetPinDto), asyncHandler(UserController.resetPin))

        this.router.post(`${this.path}/avatar`, requireAuth, upload.any(), asyncHandler(UserController.uploadAvatar))
        this.router.post(`${this.path}/background`, requireAuth, upload.any(), asyncHandler(UserController.uploadBackground))
        this.router.get(`${this.path}/rankings`, asyncHandler(UserController.getTopUsers))

        this.router.put(`${this.path}/profile`, requireAuth, validationMiddleware(UpdateProfileDto), asyncHandler(UserController.updateProfile))
        this.router.get(`${this.path}/:key/profile`, requireAuth, requireOwner('users'), asyncHandler(UserController.getProfile))
        this.router.get(`${this.path}/:name/brief`, asyncHandler(UserController.getBriefByName)) // public route
        this.router.get(`${this.path}/:key/totp`, requireAuth, requireOwner('users'), asyncHandler(UserController.getTotp))
        this.router.post(
            `${this.path}/:key/totp`,
            requireAuth,
            requireOwner('users'),
            validationMiddleware(SetupTotpDto),
            asyncHandler(UserController.setTotp)
        )
        this.router.post(
            `${this.path}/:key/security`,
            requireAuth,
            requireOwner('users'),
            validationMiddleware(UpdateSecurityDto),
            asyncHandler(UserController.updateSecurity)
        )
        this.router.get(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(UserController.getUserList))
        this.router.get(`${this.path}/username`, asyncHandler(UserController.searchUser))

        this.router.put(
            `${this.path}/:key/profile/admin`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(AdminUpdateProfileDto),
            asyncHandler(UserController.updateProfileByAdmin)
        )

        this.router.post(`${this.path}/:key/credentials/reset`, requireAuth, requireAdmin(), asyncHandler(UserController.resetCredentials))
        this.router.post(`${this.path}/credentials/setup`, validationMiddleware(SetupCredentialsDto), asyncHandler(UserController.setupCredentials))

        this.router.post(
            `${this.path}/:key/status/update`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(UpdateUserStatusDto),
            asyncHandler(UserController.updateUserStatus)
        )
        this.router.post(`${this.path}/:key/remove`, requireAuth, requireAdmin(), asyncHandler(UserController.removeUser))
        this.router.post(`${this.path}/:key/totp/reset`, requireAuth, requireAdmin(), asyncHandler(UserController.resetTotp))
        this.router.post(
            `${this.path}/:key/role/update`,
            requireAuth,
            requireAdmin(),
            validationMiddleware(UpdateUserRoleDto),
            asyncHandler(UserController.updateUserRole)
        )
        this.router.post(
            `${this.path}/:key/phone/update`,
            requireAuth,
            requireOwner('users'),
            validationMiddleware(UpdatePhoneDto),
            asyncHandler(UserController.updatePhone)
        )
        this.router.post(
            `${this.path}/:key/email/update`,
            requireAuth,
            requireOwner('users'),
            validationMiddleware(UpdateEmailDto),
            asyncHandler(UserController.updateEmail)
        )
        this.router.get(`${this.path}/list/export`, requireAuth, requireAdmin(), asyncHandler(UserController.exportAllUser))

        this.router.get(`${this.path}/:key/assets`, requireAuth, requireOwner('users'), asyncHandler(UserController.getUserAssets))

        this.router.get(`${this.path}/email/verify`, requireAuth, asyncHandler(UserController.getEmailVerificationCode))
        this.router.post(
            `${this.path}/email/verify`,
            requireAuth,
            validationMiddleware(EmailVerifyDto),
            asyncHandler(UserController.verifyEmailAddress)
        )
        this.router.get(`${this.path}/featured`, asyncHandler(UserController.getFeaturedUsers))
        this.router.put(`${this.path}/featured`, requireAuth, requireAdmin(), asyncHandler(UserController.bulkUpdateUserFeatured))
    }
}

export default UserRouter
