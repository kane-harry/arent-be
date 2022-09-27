import { UserAuthCodeType } from '@config/constants'
import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import EmailService from '@modules/emaill/email.service'
import { CreateUserAuthCodeDto } from '@modules/user_auth_code/user_auth_code.dto'
import UserAuthCodeService from '@modules/user_auth_code/user_auth_code.service'
import { getPhoneInfo, stripPhoneNumber } from '@utils/phoneNumber'
import sendSms from '@utils/sms'
import { downloadResource } from '@utils/utility'
import { Request, Response } from 'express'
import {
    AdminUpdateProfileDto,
    AuthorizeDto,
    CreateUserDto,
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
import { IUserQueryFilter } from './user.interface'
import UserService from './user.service'

export default class UserController {
    static async getUserAuthCode(req: CustomRequest, res: Response) {
        const params: CreateUserAuthCodeDto = req.body
        if (params.type === UserAuthCodeType.Phone) {
            params.owner = stripPhoneNumber(params.owner)
            const phoneInfo = getPhoneInfo(params.owner)
            if (!phoneInfo.is_valid) {
                throw new BizException(AuthErrors.invalid_phone, new ErrorContext('auth.controller', 'getUserAuthCode', { phone: params.owner }))
            }
        }
        const deliveryMethod = (owner: any, code: string) => {
            switch (params.type) {
                case UserAuthCodeType.Email:
                    EmailService.sendUserAuthVerificationCode({ address: owner, code })
                    break
                case UserAuthCodeType.Phone:
                    sendSms('LightLink', `[LightLink] Please use this verification code: ${code} to complete registration in 15 minutes.`, owner)
                    break
                default:
                    break
            }
        }

        const data = await UserAuthCodeService.generateCode(params, deliveryMethod)
        return res.send(data)
    }

    static async authorize(req: CustomRequest, res: Response) {
        const params: AuthorizeDto = req.body
        if (params.type === UserAuthCodeType.Phone) {
            params.owner = stripPhoneNumber(params.owner)
            const phoneInfo = getPhoneInfo(params.owner)
            if (!phoneInfo.is_valid) {
                throw new BizException(AuthErrors.invalid_phone, new ErrorContext('auth.controller', 'getUserAuthCode', { phone: params.owner }))
            }
        }
        const data = await UserService.authorize(params, { req })

        return res.send(data)
    }

    static async register(req: CustomRequest, res: Response) {
        const userData: CreateUserDto = req.body
        const data = await UserService.register(userData, { req })

        return res.send(data)
    }

    static async forgotPassword(req: Request, res: Response) {
        const params: ForgotPasswordDto = req.body
        const data = await UserService.forgotPassword(params)

        return res.send(data)
    }

    static async resetPassword(req: AuthenticationRequest, res: Response) {
        const params: ResetPasswordDto = req.body
        const data = await UserService.resetPassword(params, { req })

        return res.send(data)
    }

    static async forgotPin(req: AuthenticationRequest, res: Response) {
        const params: ForgotPinDto = req.body
        const data = await UserService.forgotPin(params)

        return res.send(data)
    }

    static async resetPin(req: AuthenticationRequest, res: Response) {
        const params: ResetPinDto = req.body
        const data = await UserService.resetPin(params, { req })

        return res.send(data)
    }

    static async uploadAvatar(req: AuthenticationRequest, res: Response) {
        const data = await UserService.uploadAvatar(req.files, { req })
        return res.send(data)
    }

    static async updateProfile(req: AuthenticationRequest, res: Response) {
        const userData: UpdateProfileDto = req.body
        const data = await UserService.updateProfile(userData, { req })
        return res.send(data)
    }

    static async updateProfileByAdmin(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const userData: AdminUpdateProfileDto = req.body
        const data = await UserService.updateProfileByAdmin(key, userData, { req })
        return res.send(data)
    }

    static async getProfile(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const data = await UserService.getProfile(key)
        return res.send(data)
    }

    static async getBriefByName(req: Request, res: Response) {
        const chatName: string = req.params.name
        const data = await UserService.getBriefByName(chatName)
        return res.send(data)
    }

    static async getTotp(req: AuthenticationRequest, res: Response) {
        const data = await UserService.getTotp({ req })
        return res.send(data)
    }

    static async setTotp(req: AuthenticationRequest, res: Response) {
        const params: SetupTotpDto = req.body
        const data = await UserService.setTotp(params, { req })
        return res.send(data)
    }

    static async updateSecurity(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateSecurityDto = req.body
        const data = await UserService.updateSecurity(userKey, params, { req })
        return res.send(data)
    }

    static async getUserList(req: CustomRequest, res: Response) {
        const filter = req.query as IUserQueryFilter
        const data = await UserService.getUserList(filter)
        return res.send(data)
    }

    static async searchUser(req: CustomRequest, res: Response) {
        const filter = req.query as IUserQueryFilter
        const data = await UserService.searchUser(filter)
        return res.send(data)
    }

    static async exportAllUser(req: CustomRequest, res: Response) {
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

    static async resetCredentials(req: AuthenticationRequest, res: Response) {
        const key: string = req.params.key
        const data = await UserService.resetCredentials(key, { req })
        return res.send(data)
    }

    static async setupCredentials(req: AuthenticationRequest, res: Response) {
        const params: SetupCredentialsDto = req.body
        const data = await UserService.setupCredentials(params, { req })
        return res.send(data)
    }

    static async updateUserStatus(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateUserStatusDto = req.body
        const data = await UserService.updateUserStatus(userKey, params, { req })
        return res.json(data)
    }

    static async removeUser(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const data = await UserService.removeUser(userKey, { req })
        return res.json(data)
    }

    static async resetTotp(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const data = await UserService.resetTotp(userKey, { req })
        return res.json(data)
    }

    static async updateUserRole(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateUserRoleDto = req.body
        const data = await UserService.updateUserRole(userKey, params, { req })
        return res.json(data)
    }

    static async updatePhone(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdatePhoneDto = req.body
        const data = await UserService.updatePhone(userKey, params, { req })
        return res.json(data)
    }

    static async updateEmail(req: AuthenticationRequest, res: Response) {
        const userKey = req.params.key
        const params: UpdateEmailDto = req.body
        const data = await UserService.updateEmail(userKey, params, { req })
        return res.json(data)
    }

    static async getUserAssets(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const data = await UserService.getUserAssets(key)
        return res.send(data)
    }
}
