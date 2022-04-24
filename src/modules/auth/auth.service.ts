import * as bcrypt from 'bcrypt'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { CreateUserDto } from '@modules/user/user.dto'
import { ForgotPasswordDto, ForgotPinDto, LogInDto, ResetPasswordDto, ResetPinDto } from './auth.dto'
import { toLower, capitalize, escapeRegExp, trim } from 'lodash'
import { IUser, UserStatus } from '@modules/user/user.interface'
import UserModel from '@modules/user/user.model'
import { VerificationCode } from '@modules/verification_code/code.model'
import { CodeType } from '@modules/verification_code/code.interface'
import { AuthErrors } from '@exceptions/custom.error'
import * as jwt from 'jsonwebtoken'
import { config } from '@config'
import VerificationCodeService from '@modules/verification_code/code.service'
import UserLogModel from '@modules/user_logs/user_log.model'
import { UserActions } from '@modules/user_logs/user_log.interface'
import { CustomRequest } from '@middlewares/request.middleware'
import AccountService from '@modules/account/account.service'

export default class AuthService {
    static async register(userData: CreateUserDto) {
        userData = AuthService.formatCreateUserDto(userData)
        const user = await UserModel.findOne({ email: userData.email }).exec()
        if (user) {
            throw new BizException(
                AuthErrors.registration_email_exists_error,
                new ErrorContext('auth.service', 'register', { email: userData.email })
            )
        }
        if (config.system.registrationRequireEmailVerified) {
            const codeData = await VerificationCode.findOne({ owner: userData.email, type: CodeType.EmailRegistration }).exec()
            if (!codeData || codeData.enabled) {
                throw new BizException(
                    AuthErrors.registration_email_not_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: userData.email })
                )
            }
        }

        const mode = new UserModel({
            ...userData,
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            avatar: null,
            status: UserStatus.Normal
        })
        const savedData = await mode.save()
        await AccountService.initUserAccounts(savedData._id)
        const token = AuthService.createToken(savedData)

        return { user: savedData, token: token }
    }

    private static formatCreateUserDto(userData: CreateUserDto) {
        userData.firstName = capitalize(escapeRegExp(userData.firstName))
        userData.lastName = capitalize(escapeRegExp(userData.lastName))
        userData.nickName = capitalize(escapeRegExp(userData.nickName))
        userData.email = toLower(trim(userData.email))
        userData.password = trim(userData.password)
        userData.pin = trim(userData.pin)
        return userData
    }

    static async logIn(logInData: LogInDto, options?: { req: CustomRequest }) {
        const user = await UserModel.findOne({ email: logInData.email }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', {}))
        }

        const isPasswordMatching = await bcrypt.compare(logInData.password, user.get('password', null, { getters: false }))
        if (!isPasswordMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', {}))
        }

        // create token
        const token = AuthService.createToken(user)

        // send mail warning login
        // run job to delete expired tokens
        // TODO: store token to database

        new UserLogModel({
            userId: user._id,
            action: UserActions.Login,
            agent: options?.req.agent,
            ipAddress: options?.req.ip_address
        }).save()

        return { user: user, token: token }
    }

    private static createToken(user: IUser) {
        const expiresIn = config.JWT.tokenExpiresIn
        const secret = String(config.JWT.secret)
        // TODO: add client id ? not allow multiple device ?
        const payload = {
            id: user._id
        }
        return jwt.sign(payload, secret, { expiresIn })
    }

    static async resetPassword(passwordData: ResetPasswordDto, _user: IUser, options?: { req: CustomRequest }) {
        if (passwordData.newPasswordConfirmation !== passwordData.newPassword) {
            throw new BizException(AuthErrors.data_confirmation_mismatch_error, new ErrorContext('auth.service', 'resetPassword', {}))
        }

        const user = await UserModel.findOne({ email: _user?.email }).exec()

        const oldPassHashed = String(user?.get('password', null, { getters: false }))

        const isPasswordMatching = await bcrypt.compare(passwordData.oldPassword, oldPassHashed)
        if (!isPasswordMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'resetPassword', {}))
        }
        const newPassHashed = await bcrypt.hash(passwordData.newPassword, 10)
        user?.set('password', newPassHashed, String)
        user?.save()

        new UserLogModel({
            userId: user?._id,
            action: UserActions.ResetPassword,
            agent: options?.req.agent,
            ipAddress: options?.req.ip_address,
            oldData: {
                password: oldPassHashed
            },
            newData: {
                password: newPassHashed
            }
        }).save()

        return { success: true }
    }

    static async forgotPassword(passwordData: ForgotPasswordDto, options?: { req: CustomRequest }) {
        const { success } = await VerificationCodeService.verifyCode({
            ...passwordData,
            codeType: CodeType.ForgotPassword
        })
        if (!success) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('auth.service', 'forgotPassword', { email: passwordData.email })
            )
        }

        const user = await UserModel.findOne({ email: passwordData?.email }).exec()

        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'forgotPassword', {}))
        }

        const oldPassHashed = String(user?.get('password', null, { getters: false }))
        const newPassHashed = await bcrypt.hash(passwordData.newPassword, 10)

        user?.set('password', newPassHashed, String)
        user?.save()

        new UserLogModel({
            userId: user?._id,
            action: UserActions.ForgotPassword,
            agent: options?.req.agent,
            ipAddress: options?.req.ip_address,
            oldData: {
                password: oldPassHashed
            },
            newData: {
                password: newPassHashed
            }
        }).save()

        return { success: true }
    }

    static async resetPin(pinData: ResetPinDto, _user: IUser, options?: { req: CustomRequest }) {
        if (pinData.newPinConfirmation !== pinData.newPin) {
            throw new BizException(AuthErrors.data_confirmation_mismatch_error, new ErrorContext('auth.service', 'resetPin', {}))
        }

        const user = await UserModel.findOne({ email: _user?.email }).exec()

        const oldPinHashed = String(user?.get('pin', null, { getters: false }))
        const isPinMatching = await bcrypt.compare(pinData.oldPin, oldPinHashed)
        if (!isPinMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'resetPin', {}))
        }
        const newPinHashed = await bcrypt.hash(pinData.newPin, 10)
        user?.set('pin', newPinHashed, String)
        user?.save()

        new UserLogModel({
            userId: user?._id,
            action: UserActions.ResetPin,
            agent: options?.req.agent,
            ipAddress: options?.req.ip_address,
            oldData: {
                pin: oldPinHashed
            },
            newData: {
                pin: newPinHashed
            }
        }).save()

        return { success: true }
    }

    static async forgotPin(pinData: ForgotPinDto, options?: { req: CustomRequest }) {
        const { success } = await VerificationCodeService.verifyCode({
            ...pinData,
            codeType: CodeType.ForgotPin
        })
        if (!success) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('auth.service', 'forgotPin', { email: pinData?.email })
            )
        }

        const user = await UserModel.findOne({ email: pinData?.email }).exec()

        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        const oldPinHashed = String(user?.get('pin', null, { getters: false }))
        const newPinHashed = await bcrypt.hash(pinData.newPin, 10)

        user?.set('pin', newPinHashed, String)
        user?.save()

        new UserLogModel({
            userId: user?._id,
            action: UserActions.ForgotPin,
            agent: options?.req.agent,
            ipAddress: options?.req.ip_address,
            oldData: {
                pin: oldPinHashed
            },
            newData: {
                pin: newPinHashed
            }
        }).save()

        return { success: true }
    }

    static async logOut(id: string) {
        throw new BizException(
            { message: 'Not implemented.', status: 400, code: 400 },
            new ErrorContext('transaction.service', 'getTransactionById', {})
        )
    }
}
