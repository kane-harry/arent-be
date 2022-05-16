import * as bcrypt from 'bcrypt'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { CreateUserDto } from '@modules/user/user.dto'
import { ForgotPasswordDto, ForgotPinDto, LogInDto, RefreshTokenDto, ResetPasswordDto, ResetPinDto } from './auth.dto'
import { capitalize, escapeRegExp, toLower, trim } from 'lodash'
import { IUser } from '@modules/user/user.interface'
import UserModel from '@modules/user/user.model'
import { VerificationCode } from '@modules/verification_code/code.model'
import { CodeType } from '@modules/verification_code/code.interface'
import { AuthErrors } from '@exceptions/custom.error'
import { config } from '@config'
import VerificationCodeService from '@modules/verification_code/code.service'
import UserLogModel from '@modules/user_logs/user_log.model'
import { UserActions } from '@modules/user_logs/user_log.interface'
import { CustomRequest } from '@middlewares/request.middleware'
import AccountService from '@modules/account/account.service'
import { AuthModel } from './auth.model'
import { AuthTokenType, TwoFactorType } from './auth.interface'
import crypto from 'crypto'
import { verifyTotpToken } from '@common/twoFactor'

export default class AuthService {
    static async register(userData: CreateUserDto, options?: { req: CustomRequest }) {
        userData = AuthService.formatCreateUserDto(userData)
        const user = await UserModel.findOne({ email: userData.email }).exec()
        if (user) {
            throw new BizException(
                AuthErrors.registration_email_exists_error,
                new ErrorContext('auth.service', 'register', { email: userData.email })
            )
        }
        let emailVerified = false
        if (config.system.registrationRequireEmailVerified) {
            const codeData = await VerificationCode.findOne({ owner: userData.email, type: CodeType.EmailRegistration }).exec()
            if (!codeData || codeData.enabled) {
                throw new BizException(
                    AuthErrors.registration_email_not_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: userData.email })
                )
            }
            emailVerified = true
        }

        const mode = new UserModel({
            ...userData,
            key: crypto.randomBytes(16).toString('hex'),
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            avatar: null,
            twoFactorEnable: TwoFactorType.EMAIL,
            role: 0,
            emailVerified
        })
        const savedData = await mode.save()
        await AccountService.initUserAccounts(savedData.key)

        return { success: true }
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

        await this.verifyTwoFactor(user, logInData)

        // create token
        const accessToken = AuthModel.createAccessToken(user._id)
        const refreshToken = AuthModel.createRefreshToken(user._id)

        // TODO: check device login
        // send mail warning login
        // run job to delete expired tokens
        new AuthModel({
            key: crypto.randomBytes(16).toString('hex'),
            token: refreshToken,
            userId: user._id
        }).save()

        new UserLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            userId: user._id,
            action: UserActions.Login,
            agent: options?.req.agent,
            ipAddress: options?.req.ip_address
        }).save()

        return { user: user, token: accessToken, refreshToken }
    }

    static async refreshToken(refreshTokenData: RefreshTokenDto) {
        const authData = await AuthModel.findOne({ token: refreshTokenData.refreshToken, type: AuthTokenType.RefreshToken }).exec()
        if (!authData) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'refreshToken', {}))
        }
        try {
            const payload = AuthModel.verifyRefreshToken(refreshTokenData.refreshToken) as any
            const token = AuthModel.createAccessToken(payload.id)
            return { token }
        } catch (err) {
            const error = err as any
            switch (error?.name) {
            case 'TokenExpiredError':
                AuthModel.deleteOne({ token: refreshTokenData.refreshToken, type: AuthTokenType.RefreshToken }).exec()
                throw new BizException(AuthErrors.session_expired, new ErrorContext('auth.service', 'refreshToken', {}))
            case 'JsonWebTokenError':
                throw new BizException(AuthErrors.invalid_refresh_token, new ErrorContext('auth.service', 'refreshToken', {}))

            default:
                throw new BizException(AuthErrors.invalid_refresh_token, new ErrorContext('auth.service', 'refreshToken', {}))
            }
        }
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
            key: crypto.randomBytes(16).toString('hex'),
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
            codeType: CodeType.ForgotPassword,
            owner: passwordData.email,
            code: passwordData.code
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
            key: crypto.randomBytes(16).toString('hex'),
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
            key: crypto.randomBytes(16).toString('hex'),
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
            codeType: CodeType.ForgotPin,
            owner: pinData.email,
            code: pinData.code
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
            key: crypto.randomBytes(16).toString('hex'),
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

    static async logOut(refreshTokenData: RefreshTokenDto) {
        const authData = await AuthModel.findOne({ token: refreshTokenData.refreshToken, type: AuthTokenType.RefreshToken }).exec()
        if (!authData) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'refreshToken', {}))
        }
        await AuthModel.deleteOne({ token: refreshTokenData.refreshToken, type: AuthTokenType.RefreshToken }).exec()
        return { success: true }
    }

    static async verifyTwoFactor(user: IUser, logInData: LogInDto) {
        if (!user.twoFactorEnable || !user.twoFactorEnable.length) {
            return
        }
        if (!logInData.token) {
            throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
        }
        switch (user.twoFactorEnable) {
        case TwoFactorType.PIN:
            // @ts-ignore
            const pinHash = user.get('pin', null, { getters: false })
            const isMatching = await bcrypt.compare(logInData.token, pinHash)
            if (!isMatching) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        case TwoFactorType.TOTP:
            // @ts-ignore
            const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
            if (!verifyTotpToken(twoFactorSecret, logInData.token)) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        case TwoFactorType.EMAIL: {
            const { success } = await VerificationCodeService.verifyCode({
                codeType: CodeType.EmailLogIn,
                owner: user.email,
                code: logInData.token
            })
            if (!success) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        }
        case TwoFactorType.SMS: {
            const { success } = await VerificationCodeService.verifyCode({
                codeType: CodeType.SMSLogIn,
                owner: user.phone,
                code: logInData.token
            })
            if (!success) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        }
        }
    }
}
