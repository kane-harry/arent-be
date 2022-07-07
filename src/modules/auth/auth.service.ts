import * as bcrypt from 'bcrypt'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { CreateUserDto } from '@modules/user/user.dto'
import { ForgotPasswordDto, ForgotPinDto, LogInDto, RefreshTokenDto, ResetPasswordDto, ResetPinDto } from './auth.dto'
import { capitalize, escapeRegExp, toLower, trim } from 'lodash'
import { IUser, UserStatus } from '@modules/user/user.interface'
import UserModel from '@modules/user/user.model'
import { VerificationCode } from '@modules/verification_code/code.model'
import { CodeType } from '@modules/verification_code/code.interface'
import { AuthErrors } from '@exceptions/custom.error'
import VerificationCodeService from '@modules/verification_code/code.service'
import UserLogModel from '@modules/user_logs/user_log.model'
import { UserActions } from '@modules/user_logs/user_log.interface'
import AccountService from '@modules/account/account.service'
import { AuthModel } from './auth.model'
import { AuthTokenType, MFAType } from './auth.interface'
import crypto from 'crypto'
import SettingService from '@modules/setting/setting.service'
import { getPhoneInfo, stripPhoneNumber } from '@utils/phone-helper'
import UserService from '@modules/user/user.service'
import { generateUnixTimestamp } from '@utils/utility'
import { verifyToken } from '@utils/totp'
import sendSms from '@utils/sms'
import EmailService from '@modules/emaill/email.service'

export default class AuthService {
    static async verifyRegistration(userData: CreateUserDto, options?: any) {
        userData = await AuthService.formatCreateUserDto(userData)
        const setting: any = await SettingService.getGlobalSetting()
        if (setting.registrationRequireEmailVerified) {
            const codeData = await VerificationCode.findOne({ owner: userData.email, type: CodeType.EmailRegistration }).exec()
            if (!codeData || !codeData.verified) {
                throw new BizException(
                    AuthErrors.registration_email_not_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: userData.email })
                )
            }
        }
        const filter: any = { $or: [{ email: userData.email }] }
        if (userData.phone) {
            filter.$or.push({ phone: userData.phone })
        }
        // const filter = { $or: [{ email: userData.email }, { phone: userData.phone }] }
        const user = await UserModel.findOne(filter).select('key email phone').exec()
        if (user) {
            if (userData.email && userData.email === user.email) {
                throw new BizException(
                    AuthErrors.registration_email_exists_error,
                    new ErrorContext('auth.service', 'register', { email: userData.email })
                )
            }
            if (userData.phone && userData.phone === user.phone) {
                throw new BizException(
                    AuthErrors.registration_phone_exists_error,
                    new ErrorContext('auth.service', 'register', { phone: userData.phone })
                )
            }
        }
        return { success: true }
    }

    static async register(userData: CreateUserDto, options?: any) {
        userData = await AuthService.formatCreateUserDto(userData)
        await this.verifyRegistration(userData, options)
        const setting: any = await SettingService.getGlobalSetting()
        const mfaSettings = { type: MFAType.EMAIL, loginEnabled: setting.loginRequireMFA, withdrawEnabled: setting.withdrawRequireMFA }
        let emailVerified = false
        if (setting.registrationRequireEmailVerified) {
            emailVerified = true
            mfaSettings.type = MFAType.EMAIL
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
            mfaSettings.type = MFAType.SMS
        }
        const currentTimestamp = generateUnixTimestamp()
        const mode = new UserModel({
            ...userData,
            key: crypto.randomBytes(16).toString('hex'),
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            avatar: null,
            role: 0,
            emailVerified,
            phoneVerified,
            mfaSettings,
            tokenVersion: currentTimestamp
        })
        const savedData = await mode.save()
        await AccountService.initUserAccounts(savedData.key)

        options.forceLogin = true
        return this.logIn({ email: userData.email, password: userData.password, token: null }, options)
    }

    private static async formatCreateUserDto(userData: CreateUserDto) {
        userData.firstName = capitalize(escapeRegExp(trim(userData.firstName)))
        userData.lastName = capitalize(escapeRegExp(trim(userData.lastName)))
        userData.chatName = await UserService.generateRandomName(userData.firstName)
        userData.email = toLower(trim(userData.email))
        userData.password = trim(userData.password)
        userData.pin = trim(userData.pin)
        if (userData.phone) {
            const phoneInfo: any = await getPhoneInfo(userData.phone)
            if (!phoneInfo.isValid) {
                throw new BizException(AuthErrors.invalid_phone, new ErrorContext('auth.service', 'register', { phone: userData.phone }))
            }
            userData.phone = phoneInfo.number
            userData.country = phoneInfo.country
        }
        return userData
    }

    static async logIn(logInData: LogInDto, options?: any) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ email: logInData.email, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
        }
        if (user.status === UserStatus.Locked) {
            throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'login', { email: logInData.email }))
        }

        if (user.changePasswordNextLogin && user.changePasswordNextLogin === true) {
            let changePasswordNextLoginAttempts = user.changePasswordNextLoginAttempts || 0
            changePasswordNextLoginAttempts++

            user.set('changePasswordNextLoginAttempts', changePasswordNextLoginAttempts, Number)
            user.set('tokenVersion', currentTimestamp, Number)
            user.save()
            if (changePasswordNextLoginAttempts >= 5) {
                user.set('status', UserStatus.Locked, String)
                user.set('loginCount', 0, Number)
                user.save()
                throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'login', { email: logInData.email }))
            }

            if (
                !user.changePasswordNextLoginCode ||
                toLower(user.changePasswordNextLoginCode) !== toLower(logInData.password) ||
                user.changePasswordNextLoginTimestamp < currentTimestamp - 60 * 15
            ) {
                throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
            }
            return {
                key: user.key,
                email: user.email,
                phone: user.phone,
                changePasswordNextLogin: true
            }
        }

        let loginCount = user.loginCount || 0
        if (loginCount >= 5 && user.lockedTimestamp > currentTimestamp - 60 * 60) {
            const retryInMinutes = Math.ceil((user.lockedTimestamp - (currentTimestamp - 3600)) / 60)
            user.set('tokenVersion', currentTimestamp, Number)
            user.set('lockedTimestamp', currentTimestamp, Number)
            user.save()
            throw new BizException(
                {
                    message: `Please try again in ${retryInMinutes} minutes, or click "forgot password" to reset your login password and login again`,
                    code: 0,
                    status: 400
                },
                new ErrorContext('auth.service', 'logIn', { email: logInData.email })
            )
        }

        const isPasswordMatching = await bcrypt.compare(logInData.password, user.get('password', null, { getters: false }))
        if (!isPasswordMatching) {
            loginCount = loginCount + 1
            user.set('loginCount', loginCount, Number)
            user.set('lockedTimestamp', currentTimestamp, Number)
            user.set('tokenVersion', currentTimestamp, Number)
            user.save()
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
        }

        if (!options.forceLogin) {
            // @ts-ignore
            if (user.mfaSettings.loginEnabled) {
                const data: any = await this.verifyTwoFactor(user, logInData)
                if (data.requireMFACode) {
                    return data
                }
            }
        }

        // create token
        const accessToken = AuthModel.createAccessToken(user._id, currentTimestamp)

        user.set('loginCount', 0, Number)
        user.set('lockedTimestamp', currentTimestamp, Number)
        user.set('tokenVersion', currentTimestamp, Number)
        user.save()

        new UserLogModel({
            key: crypto.randomBytes(16).toString('hex'),
            userKey: user.key,
            action: UserActions.Login,
            agent: options?.req.agent,
            ipAddress: options?.req.ip_address
        }).save()

        return { user: user, token: accessToken }
    }

    // static async refreshToken(user) {
    //     const authData = await AuthModel.findOne({ token: refreshTokenData.refreshToken, type: AuthTokenType.RefreshToken }).exec()
    //     if (!authData) {
    //         throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'refreshToken', {}))
    //     }
    //     try {
    //         const payload = AuthModel.verifyRefreshToken(refreshTokenData.refreshToken) as any
    //         const token = AuthModel.createAccessToken(payload.id)
    //         return { token }
    //     } catch (err) {
    //         const error = err as any
    //         switch (error?.name) {
    //         case 'TokenExpiredError':
    //             AuthModel.deleteOne({ token: refreshTokenData.refreshToken, type: AuthTokenType.RefreshToken }).exec()
    //             throw new BizException(AuthErrors.session_expired, new ErrorContext('auth.service', 'refreshToken', {}))
    //         case 'JsonWebTokenError':
    //             throw new BizException(AuthErrors.invalid_refresh_token, new ErrorContext('auth.service', 'refreshToken', {}))

    //         default:
    //             throw new BizException(AuthErrors.invalid_refresh_token, new ErrorContext('auth.service', 'refreshToken', {}))
    //         }
    //     }
    // }

    static async updateTokenVersion(key: string) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'tokenVersion', {}))
        }
        user.set('tokenVersion', currentTimestamp, Number)
        await user.save()
        return { success: true }
    }

    static async getCurrentUser(key: string) {
        const user = await UserModel.findOne({ key }).exec()
        return user
    }

    static async forgotPassword(params: ForgotPasswordDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email }).select('key email phone').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone }).select('key email phone').exec()
        }

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPassword', {}))
        }

        const res = await VerificationCodeService.generateCode({
            owner: params.owner,
            codeType: params.type === 'email' ? CodeType.EmailForgotPassword : CodeType.SMSForgotPassword
        })

        if (res.type === 'email') {
            await EmailService.sendPasswordResetCode({ address: params.owner, code: res.code })
        }

        return { success: true }
    }

    static async resetPassword(params: ResetPasswordDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email }).select('key email phone pin').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone }).select('key email phone pin').exec()
        }
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'resetPassword', {}))
        }
        const isPinCodeMatching = await bcrypt.compare(params.pin, user.get('pin', null, { getters: false }))
        if (!isPinCodeMatching) {
            throw new BizException(AuthErrors.invalid_pin_code_error, new ErrorContext('auth.service', 'resetPassword', {}))
        }
        const { success } = await VerificationCodeService.verifyCode({
            owner: params.owner,
            code: params.code,
            codeType: params.type === 'email' ? CodeType.EmailForgotPassword : CodeType.SMSForgotPassword
        })
        if (success) {
            const newPassHashed = await bcrypt.hash(params.password, 10)
            user.set('password', newPassHashed, String)
            user.save()

            // logout
            await AuthService.updateTokenVersion(user.key)

            const subject = 'Welcome to LightLink'
            const html = 'You have successfully reset your password!'

            // send notifications user via email and phone
            if (params.type === 'email') {
                await EmailService.sendPasswordResetComplete({ address: user.email })
            } else if (params.type === 'phone') {
                await sendSms(subject, html, html, user.phone)
            }
        }
        return { success }
    }

    static async forgotPin(params: ForgotPinDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email }).select('key email phone').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone }).select('key email phone').exec()
        }

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        const res = await VerificationCodeService.generateCode({
            owner: params.owner,
            codeType: params.type === 'email' ? CodeType.EmailForgotPin : CodeType.SMSForgotPin
        })

        if (res.type === 'email') {
            await EmailService.sendPinResetCode({ address: params.owner, code: res.code })
        }

        return { success: true }
    }

    static async resetPin(params: ResetPinDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email }).select('key email phone password').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone }).select('key email phone password').exec()
        }
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'resetPin', {}))
        }
        const isPasswordMatching = await bcrypt.compare(params.password, user.get('password', null, { getters: false }))
        if (!isPasswordMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', {}))
        }

        const { success } = await VerificationCodeService.verifyCode({
            owner: params.owner,
            code: params.code,
            codeType: params.type === 'email' ? CodeType.EmailForgotPin : CodeType.SMSForgotPin
        })
        if (success) {
            const newPin = await bcrypt.hash(params.pin, 10)
            user.set('pin', newPin, String)
            user.save()

            // logout
            await AuthService.updateTokenVersion(user.key)

            // send notifications user via email and phone
            const subject = 'Welcome to LightLink'
            const html = 'You have successfully reset your pin!'

            if (params.type === 'email') {
                await EmailService.sendPinResetComplete({ address: user.email })
            } else if (params.type === 'phone') {
                await sendSms(subject, html, html, user.phone)
            }
        }
        return { success }
    }

    // TODO : RE
    static async verifyTwoFactor(user: IUser, logInData: any, codeType: any = null) {
        if (!logInData.token || !logInData.token.length || logInData.token === 'undefined') {
            await this.sendMFACode(user)
            const result = { requireMFACode: true, type: user.mfaSettings.type, status: 'sent' }
            return result
        }

        // TODO - refactor ???

        // @ts-ignore
        switch (user.mfaSettings.type) {
        case MFAType.PIN:
            // @ts-ignore
            const pinHash = user.get('pin', null, { getters: false })
            const isMatching = await bcrypt.compare(logInData.token, pinHash)
            if (!isMatching) {
                throw new BizException(AuthErrors.invalid_pin_code_error, new ErrorContext('auth.service', 'logIn', {}))
            }
            break
        case MFAType.TOTP:
            // @ts-ignore
            const totpSecret = String(user?.get('totpSecret', null, { getters: false }))
            if (!verifyToken(totpSecret, logInData.token)) {
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
            codeType = codeType ?? CodeType.SMSLogin
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
        return { requireMFACode: false, type: user.mfaSettings.type, status: 'verified' }
    }

    // TODO - refactor
    static async sendMFACode(user: IUser) {
        // @ts-ignore
        switch (user.mfaSettings.type) {
        case MFAType.EMAIL: {
            const data: any = await VerificationCodeService.generateCode({ codeType: CodeType.EmailLogIn, owner: user.email })
            if (data.type === 'email') {
                await EmailService.sendLoginVerificationCode({ address: user.email, code: data.code })
            }
            data.message = 'Please check your email for login code'
            return data
        }
        case MFAType.SMS: {
            const data: any = await VerificationCodeService.generateCode({ codeType: CodeType.SMSLogin, owner: user.phone })
            data.message = 'Please check your phone for login code'
            return data
        }
        case MFAType.PIN: {
            const data: any = {}
            data.message = 'Please enter your pin as login code'
            return data
        }
        case MFAType.TOTP: {
            const data: any = {}
            data.message = 'Please check Google Authenticator for login code'
            return data
        }
        }
    }
}
