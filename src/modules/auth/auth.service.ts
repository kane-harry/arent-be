import * as bcrypt from 'bcrypt'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { CreateUserDto } from '@modules/user/user.dto'
import { ForgotPasswordDto, ForgotPinDto, LogInDto, ResetPasswordDto, ResetPinDto } from './auth.dto'
import { capitalize, escapeRegExp, toLower, trim } from 'lodash'
import { IUser, UserStatus } from '@modules/user/user.interface'
import UserModel from '@modules/user/user.model'
import { VerificationCode } from '@modules/verification_code/code.model'
import { AuthErrors } from '@exceptions/custom.error'
import VerificationCodeService from '@modules/verification_code/code.service'
import UserSecurityModel from '@modules/user_security/user_security.model'
import AccountService from '@modules/account/account.service'
import { AuthModel } from './auth.model'
import { AuthTokenType, MFAType } from './auth.interface'
import crypto from 'crypto'
import SettingService from '@modules/setting/setting.service'
import { getPhoneInfo, stripPhoneNumber } from '@utils/phoneNumber'
import UserService from '@modules/user/user.service'
import { generateUnixTimestamp } from '@utils/utility'
import { verifyToken } from '@utils/totp'
import sendSms from '@utils/sms'
import EmailService from '@modules/emaill/email.service'
import { SecurityActions } from '@modules/user_security/user_security.interface'
import UserHistoryModel from '@modules/user_history/user_history.model'
import { UserHistoryActions } from '@modules/user_history/user_history.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import SecurityService from '@modules/security/security.service'
import { ISetting } from '@modules/setting/setting.interface'
import { CodeType } from '@config/constants'

export default class AuthService {
    static async verifyRegistration(userData: CreateUserDto, options?: any) {
        userData = await AuthService.formatCreateUserDto(userData)
        const setting: ISetting = await SettingService.getGlobalSetting()
        if (setting.registration_require_email_verified) {
            const codeData = await VerificationCode.findOne({ owner: userData.email, type: CodeType.EmailRegistration }).exec()
            if (!codeData || !codeData.verified) {
                throw new BizException(
                    AuthErrors.registration_email_not_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: userData.email })
                )
            }
        }
        const filter: any = { $or: [{ email: userData.email }], removed: false }
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
        const setting: ISetting = await SettingService.getGlobalSetting()
        const mfaSettings = { type: MFAType.EMAIL, login_enabled: setting.login_require_mfa, withdraw_enabled: setting.withdraw_require_mfa }
        let emailVerified = false
        if (setting.registration_require_email_verified) {
            emailVerified = true
            mfaSettings.type = MFAType.EMAIL
        }
        let phoneVerified = false
        if (setting.registration_require_phone_verified) {
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
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            avatar: null,
            role: 0,
            email_verified: emailVerified,
            phone_verified: phoneVerified,
            mfa_settings: mfaSettings,
            token_version: currentTimestamp
        })
        const savedData = await mode.save()
        await AccountService.initUserAccounts(savedData.key)

        // create log
        new UserHistoryModel({
            user_key: mode.key,
            action: UserHistoryActions.Register,
            agent: options?.req.agent,
            country: mode.country,
            ip_address: options?.req.ip_address,
            pre_data: null,
            post_data: {
                first_name: mode.first_name,
                last_name: mode.last_name,
                chat_name: mode.chat_name,
                phone: mode.phone,
                email: mode.email,
                mfa_settings: mode.mfa_settings
            }
        }).save()

        options.force_login = true
        return this.logIn({ email: userData.email, password: userData.password, token: null }, options)
    }

    private static async formatCreateUserDto(userData: CreateUserDto) {
        userData.first_name = capitalize(escapeRegExp(trim(userData.first_name)))
        userData.last_name = capitalize(escapeRegExp(trim(userData.last_name)))
        userData.chat_name = await UserService.generateRandomName(userData.first_name)
        userData.email = toLower(trim(userData.email))
        userData.password = trim(userData.password)
        userData.pin = trim(userData.pin)
        if (userData.phone) {
            const phoneInfo = getPhoneInfo(userData.phone)
            if (!phoneInfo.is_valid) {
                throw new BizException(AuthErrors.invalid_phone, new ErrorContext('auth.service', 'register', { phone: userData.phone }))
            }
            userData.phone = phoneInfo.phone
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

        if (user.change_password_next_login && user.change_password_next_login === true) {
            let changePasswordNextLoginAttempts = user.change_password_next_login_attempts || 0
            changePasswordNextLoginAttempts++

            user.set('change_password_next_login_attempts', changePasswordNextLoginAttempts, Number)
            user.set('token_version', currentTimestamp, Number)
            user.save()
            if (changePasswordNextLoginAttempts >= 5) {
                user.set('status', UserStatus.Locked, String)
                user.set('login_count', 0, Number)
                user.save()
                throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'login', { email: logInData.email }))
            }

            if (
                !user.change_password_next_login_code ||
                toLower(user.change_password_next_login_code) !== toLower(logInData.password) ||
                user.change_password_next_login_timestamp < currentTimestamp - 60 * 15
            ) {
                throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
            }
            return {
                key: user.key,
                email: user.email,
                phone: user.phone,
                change_password_next_login: true
            }
        }

        let loginCount = user.login_count || 0
        if (loginCount >= 5 && user.locked_timestamp > currentTimestamp - 60 * 60) {
            const retryInMinutes = Math.ceil((user.locked_timestamp - (currentTimestamp - 3600)) / 60)
            user.set('token_version', currentTimestamp, Number)
            user.set('locked_timestamp', currentTimestamp, Number)
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
            user.set('login_count', loginCount, Number)
            user.set('locked_timestamp', currentTimestamp, Number)
            user.set('token_version', currentTimestamp, Number)
            user.save()
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
        }

        if (!options.force_login) {
            if (user.mfa_settings && user.mfa_settings.login_enabled) {
                const data = await SecurityService.validate2FA(user.key, CodeType.Login, logInData.token)
                if (data.status !== 'verified') {
                    return data
                }
            }
        }

        // create token
        const accessToken = AuthModel.createAccessToken(user._id, currentTimestamp)

        user.set('login_count', 0, Number)
        user.set('locked_timestamp', currentTimestamp, Number)
        user.set('token_version', currentTimestamp, Number)
        await user.save()

        new UserSecurityModel({
            user_key: user.key,
            action: SecurityActions.Login,
            agent: options?.req.agent,
            ip_address: options?.req.ip_address
        }).save()

        return { user: user, token: accessToken }
    }

    static async refreshToken(options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: options.req.user.key, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'refreshToken', {}))
        }
        const accessToken = AuthModel.createAccessToken(options.req.user._id, currentTimestamp)
        await AuthService.updateTokenVersion(options.req.user.key, currentTimestamp)
        return {
            token: accessToken
        }
    }

    static async updateTokenVersion(key: string, currentTimestamp: number) {
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'updateTokenVersion', {}))
        }
        user.set('token_version', currentTimestamp, Number)
        await user.save()
        return { success: true }
    }

    static async getCurrentUser(key: string) {
        const user = await UserModel.findOne({ key, removed: false }).exec()
        return user
    }

    static async forgotPassword(params: ForgotPasswordDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone').exec()
        }

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPassword', {}))
        }

        const deliveryMethod = (owner: any, code: string) => {
            if (params.type === 'email') {
                EmailService.sendUserForgotPasswordEmail({ address: owner, code: code })
            } else {
                sendSms(
                    'LightLink',
                    `[LightLink] You have recently requested a password reset, please enter this code ${code} into your mobile APP.`,
                    owner
                )
            }
        }
        await VerificationCodeService.generateCode(
            {
                owner: params.owner,
                user_key: user.key,
                code_type: CodeType.ForgotPassword
            },
            deliveryMethod
        )

        return { success: true }
    }

    static async resetPassword(params: ResetPasswordDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone pin password').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone pin password').exec()
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
            code_type: CodeType.ForgotPassword
        })
        if (success) {
            EmailService.sendUserPasswordResetCompletedEmail({ address: user.email })
            const newPassHashed = await bcrypt.hash(params.password, 10)

            // log
            new UserHistoryModel({
                user_key: user.key,
                action: UserHistoryActions.ResetPassword,
                agent: options?.req.agent,
                country: user.country,
                ip_address: options?.req.ip_address,
                pre_data: {
                    password: user.password
                },
                post_data: {
                    password: newPassHashed
                }
            }).save()

            user.set('password', newPassHashed, String)
            user.save()

            // logout
            await AuthService.updateTokenVersion(user.key, currentTimestamp)
        }
        return { success }
    }

    static async forgotPin(params: ForgotPinDto) {
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone').exec()
        }

        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'forgotPin', {}))
        }

        const deliveryMethod = (owner: any, code: string) => {
            if (params.type === 'email') {
                EmailService.sendUserForgotPinEmail({ address: owner, code: code })
            } else {
                sendSms(
                    'LightLink',
                    `[LightLink] You have recently requested a PIN reset, please enter this code ${code} into your mobile APP.`,
                    owner
                )
            }
        }
        await VerificationCodeService.generateCode(
            {
                owner: user.key,
                user_key: user.key,
                code_type: CodeType.ForgotPin
            },
            deliveryMethod
        )
        return { success: true }
    }

    static async resetPin(params: ResetPinDto, options: { req: AuthenticationRequest }) {
        const currentTimestamp = generateUnixTimestamp()
        let user
        if (params.type === 'email') {
            const email = toLower(trim(params.owner))
            user = await UserModel.findOne({ email, removed: false }).select('key email phone password').exec()
        } else if (params.type === 'phone') {
            const phone = await stripPhoneNumber(params.owner)
            user = await UserModel.findOne({ phone, removed: false }).select('key email phone password').exec()
        }
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'resetPin', {}))
        }
        const isPasswordMatching = await bcrypt.compare(params.password, user.get('password', null, { getters: false }))
        if (!isPasswordMatching) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'resetPin', {}))
        }

        const { success } = await VerificationCodeService.verifyCode({
            owner: user.key,
            code: params.code,
            code_type: CodeType.ForgotPin
        })
        if (success) {
            const newPin = await bcrypt.hash(params.pin, 10)
            EmailService.sendUserPinResetCompletedEmail({ address: user.email })
            // log
            new UserHistoryModel({
                user_key: user.key,
                action: UserHistoryActions.ResetPin,
                agent: options?.req.agent,
                country: user.country,
                ip_address: options?.req.ip_address,
                pre_data: {
                    pin: user.pin
                },
                post_data: {
                    pin: newPin
                }
            }).save()

            user.set('pin', newPin, String)
            user.save()

            // logout
            await AuthService.updateTokenVersion(user.key, currentTimestamp)
        }
        return { success }
    }
}
