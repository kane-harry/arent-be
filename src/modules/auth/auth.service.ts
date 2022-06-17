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
import { AuthTokenType, MFAType } from './auth.interface'
import crypto from 'crypto'
import { verifyTotpToken } from '@common/twoFactor'
import SettingService from '@modules/setting/setting.service'
import { getPhoneInfo } from '@common/phone-helper'

export default class AuthService {
    static async register(userData: CreateUserDto, options?: any) {
        if (userData.phone) {
            const phoneInfo:any = await getPhoneInfo(userData.phone)
            if (!phoneInfo.isValid) {
                throw new BizException(
                    AuthErrors.invalid_phone,
                    new ErrorContext('auth.service', 'register', { phone: userData.phone })
                )
            }
            userData.phone = phoneInfo.number
            userData.country = phoneInfo.country
        }
        userData = AuthService.formatCreateUserDto(userData)
        const filter = {
            $or: [{ email: userData.email }, { phone: userData.phone }, { nickName: userData.nickName }]
        }
        const user = await UserModel.findOne(filter).exec()
        if (user) {
            const duplicateInfo = {
                email: userData.email === user.email ? userData.email : '',
                phone: userData.phone === user.phone ? userData.phone : '',
                nickName: userData.nickName === user.nickName ? userData.nickName : ''
            }
            throw new BizException(
                AuthErrors.registration_info_exists_error,
                new ErrorContext('auth.service', 'register', duplicateInfo)
            )
        }
        const setting:any = await SettingService.getGlobalSetting()
        const MFASettings = { MFAType: MFAType.EMAIL, loginEnabled: setting.loginRequireMFA, withdrawEnabled: setting.withdrawRequireMFA }
        let emailVerified = false
        if (setting.registrationRequireEmailVerified) {
            const codeData = await VerificationCode.findOne({ owner: userData.email, type: CodeType.EmailRegistration }).exec()
            if (!codeData || codeData.enabled) {
                throw new BizException(
                    AuthErrors.registration_email_not_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: userData.email })
                )
            }
            emailVerified = true
            MFASettings.MFAType = MFAType.EMAIL
        }
        let phoneVerified = false
        if (setting.registrationRequirePhoneVerified) {
            const codeData = await VerificationCode.findOne({ owner: userData.phone, type: CodeType.PhoneRegistration }).exec()
            if (!codeData || codeData.enabled) {
                throw new BizException(
                    AuthErrors.registration_phone_not_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { phone: userData.phone })
                )
            }
            phoneVerified = true
            MFASettings.MFAType = MFAType.SMS
        }

        const mode = new UserModel({
            ...userData,
            key: crypto.randomBytes(16).toString('hex'),
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            avatar: null,
            role: 0,
            emailVerified,
            phoneVerified,
            MFASettings
        })
        const savedData = await mode.save()
        await AccountService.initUserAccounts(savedData.key)

        options.forceLogin = true
        return this.logIn({ email: userData.email, password: userData.password, token: null }, options)
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

    static async logIn(logInData: LogInDto, options?: any) {
        const user = await UserModel.findOne({ email: logInData.email, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', {}))
        }

        const isPasswordMatching = await bcrypt.compare(logInData.password, user.get('password', null, { getters: false }))
        if (!isPasswordMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', {}))
        }

        if (!options.forceLogin) {
            // @ts-ignore
            if (user.MFASettings.loginEnabled) {
                await this.verifyTwoFactor(user, logInData)
            }
        }

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
            userId: user.key,
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
            userId: user?.key,
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
            userId: user?.key,
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
            userId: user?.key,
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
            userId: user?.key,
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

    static async verifyTwoFactor(user: IUser, logInData: any, codeType: any = null) {
        if (!logInData.token || !logInData.token.length || logInData.token === 'undefined') {
            const message = await this.sendMFACode(user)
            throw new BizException(AuthErrors.token_require, new ErrorContext('auth.service', 'logIn', { message }))
        }

        // @ts-ignore
        switch (user.MFASettings.MFAType) {
        case MFAType.PIN:
            // @ts-ignore
            const pinHash = user.get('pin', null, { getters: false })
            const isMatching = await bcrypt.compare(logInData.token, pinHash)
            if (!isMatching) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        case MFAType.TOTP:
            // @ts-ignore
            const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
            if (!verifyTotpToken(twoFactorSecret, logInData.token, user.email)) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        case MFAType.EMAIL: {
            codeType = codeType ?? CodeType.EmailLogIn
            const { success } = await VerificationCodeService.verifyCode({
                codeType: codeType,
                owner: user.email,
                code: logInData.token
            })
            if (!success) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        }
        case MFAType.SMS: {
            codeType = codeType ?? CodeType.SMSLogIn
            const { success } = await VerificationCodeService.verifyCode({
                codeType: codeType,
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

    static async sendMFACode(user:IUser) {
        // @ts-ignore
        switch (user.MFASettings.MFAType) {
        case MFAType.EMAIL: {
            const data:any = await VerificationCodeService.generateCode({ codeType: CodeType.EmailLogIn, owner: user.email })
            data.message = 'Please check your email for login code'
            return data
        }
        case MFAType.SMS: {
            const data:any = await VerificationCodeService.generateCode({ codeType: CodeType.SMSLogIn, owner: user.phone })
            data.message = 'Please check your phone for login code'
            return data
        }
        case MFAType.PIN: {
            const data:any = {}
            data.message = 'Please enter your pin as login code'
            return data
        }
        case MFAType.TOTP: {
            const data:any = {}
            data.message = 'Please check Google Authenticator for login code'
            return data
        }
        }
    }
}
