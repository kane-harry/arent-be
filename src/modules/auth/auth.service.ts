import * as bcrypt from 'bcrypt'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { AuthorizeDto, CreateUserDto } from '@modules/user/user.dto'
import { LogInDto } from './auth.dto'
import { capitalize, escapeRegExp, first, toLower, trim } from 'lodash'
import UserModel from '@modules/user/user.model'
import { VerificationCode } from '@modules/verification_code/code.model'
import { AuthErrors } from '@exceptions/custom.error'
import UserSecurityModel from '@modules/user_security/user_security.model'
import { AuthModel } from './auth.model'
import SettingService from '@modules/setting/setting.service'
import { getPhoneInfo } from '@utils/phoneNumber'
import { generateUnixTimestamp } from '@utils/utility'
import { ISetting } from '@modules/setting/setting.interface'
import { CodeType, UserStatus, SecurityActions, MFAType, UserAuthCodeType } from '@config/constants'
import EmailService from '@modules/emaill/email.service'
import sendSms from '@utils/sms'
import VerificationCodeService from '@modules/verification_code/code.service'
import { verifyToken } from '@utils/totp'
import { config } from '@config'
import { VerifyUserAuthCodeDto } from '@modules/user_auth_code/user_auth_code.dto'
import UserAuthCodeService from '@modules/user_auth_code/user_auth_code.service'
import AccountService from '@modules/account/account.service'

export default class AuthService {
    protected static async formatCreateUserDto(userData: CreateUserDto) {
        userData.first_name = capitalize(escapeRegExp(trim(userData.first_name)))
        userData.last_name = capitalize(escapeRegExp(trim(userData.last_name)))
        userData.chat_name = await UserModel.generateRandomChatName(userData.chat_name)
        userData.email = trim(userData.email).toLowerCase()
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

    public static async validate2FA(userKey: string, codeType: CodeType, code?: string) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).select('key email phone mfa_settings').exec()
        if (!user || !user.key) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('security.service', 'validate2FA', { userKey }))
        }
        let mfaEnabled = false
        if (user.mfa_settings) {
            if (user.mfa_settings.login_enabled && codeType === CodeType.Login) {
                mfaEnabled = true
            } else if (user.mfa_settings.withdraw_enabled && codeType === CodeType.Withdraw) {
                mfaEnabled = true
            }
        }
        if (!mfaEnabled) {
            return { status: 'verified' }
        }
        const mfaType = user.mfa_settings?.type
        if (!code) {
            const deliveryMethod = (owner: any, code: string) => {
                if (mfaType === MFAType.EMAIL && user.email) {
                    const context = { address: user.email, code }
                    EmailService.sendUserVerificationCodeEmail(context)
                } else if (mfaType === MFAType.SMS && user.phone) {
                    sendSms('Verification', `Verification code - ${code}`, user.phone)
                } else if (mfaType === MFAType.TOTP) {
                    // do nothing
                }
            }

            await VerificationCodeService.generateCode({ owner: user.key, user_key: user.key, code_type: codeType }, deliveryMethod)
            return { require_mfa_code: true, type: mfaType, status: 'sent' }
        }

        if (mfaType === MFAType.TOTP) {
            const twoFactorSecret = String(user?.get('two_factor_secret', null, { getters: false }))
            if (!verifyToken(twoFactorSecret, code)) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('security.service', 'validate2FA', {}))
            }
        } else {
            await VerificationCodeService.verifyCode({ owner: user.key, code, code_type: codeType })
        }

        return { require_mfa_code: true, type: mfaType, status: 'verified' }
    }

    static async verifyRegistration(userData: CreateUserDto) {
        userData = await AuthService.formatCreateUserDto(userData)
        const setting: ISetting = await SettingService.getGlobalSetting()

        if (setting.registration_require_email_verified) {
            const codeData = await VerificationCode.findOne({ owner: userData.email, type: CodeType.EmailRegistration }).exec()
            if (!codeData || !codeData.verified) {
                throw new BizException(
                    AuthErrors.registration_email_not_verified_error,
                    new ErrorContext('auth.service', 'verifyRegistration', { email: userData.email })
                )
            }
        }

        if (setting.registration_require_phone_verified) {
            const codeData = await VerificationCode.findOne({ owner: userData.phone, type: CodeType.PhoneRegistration }).exec()
            if (!codeData || codeData.enabled) {
                throw new BizException(
                    AuthErrors.registration_phone_not_verified_error,
                    new ErrorContext('auth.service', 'verifyRegistration', { phone: userData.phone })
                )
            }
        }

        const filter: { [key: string]: any } = {
            $or: [{ email: userData.email }],
            removed: false
        }
        if (userData.phone) {
            filter.$or.push({ phone: userData.phone })
        }
        const user = await UserModel.findOne(filter).select('key email phone').exec()
        if (!user) {
            return { success: true }
        }

        if (user.email && userData?.email === user.email) {
            throw new BizException(
                AuthErrors.registration_email_exists_error,
                new ErrorContext('auth.service', 'verifyRegistration', { email: userData.email })
            )
        }

        if (user.phone && userData?.phone === user.phone) {
            throw new BizException(
                AuthErrors.registration_phone_exists_error,
                new ErrorContext('auth.service', 'verifyRegistration', { phone: userData.phone })
            )
        }
        return { success: true }
    }

    static async logIn(logInData: LogInDto, options?: any) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ email: logInData.email, removed: false }).exec()
        if (!user || !user.key) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
        }

        if (user.status === UserStatus.Locked || user.status === UserStatus.Suspend) {
            throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'logIn', { email: logInData.email }))
        }

        if (user.password_settings && user.password_settings.change_password_next_login === true) {
            let changePasswordNextLoginAttempts = user.password_settings.change_password_next_login_attempts || 0
            changePasswordNextLoginAttempts++

            user.set('password_settings.change_password_next_login_attempts', changePasswordNextLoginAttempts, Number)
            user.set('token_version', currentTimestamp, Number)

            if (changePasswordNextLoginAttempts >= 5) {
                user.set('status', UserStatus.Locked, String)
                user.set('login_count', 0, Number)
                await user.save()
                throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'login', { email: logInData.email }))
            }

            if (
                !user.password_settings.change_password_next_login_code ||
                toLower(user.password_settings.change_password_next_login_code) !== toLower(logInData.password) ||
                user.password_settings.change_password_next_login_timestamp < currentTimestamp - 60 * 15
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
            await user.save()
            throw new BizException(
                {
                    message: `Please try again in ${retryInMinutes} minutes, or click "forgot password" to reset your login password and login again`,
                    code: 0,
                    status: 400
                },
                new ErrorContext('auth.service', 'logIn', { email: logInData.email })
            )
        }
        const passwordHash = user.get('password', null, { getters: false })
        if (!passwordHash || !passwordHash.length) {
            throw new BizException(
                {
                    message: 'You have not setup password, please log in with verification code',
                    code: 0,
                    status: 400
                },
                new ErrorContext('auth.service', 'logIn', { email: logInData.email })
            )
        }
        const isPasswordMatching = await bcrypt.compare(logInData.password, passwordHash)
        if (!isPasswordMatching) {
            loginCount = loginCount + 1
            user.set('login_count', loginCount, Number)
            user.set('locked_timestamp', currentTimestamp, Number)
            user.set('token_version', currentTimestamp, Number)
            await user.save()
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
        }
        if (logInData.player_id) {
            user.set('player_id', logInData.player_id, String)
            await user.save()
        }
        if (!options.force_login) {
            if (user.mfa_settings && user.mfa_settings.login_enabled) {
                const data = await this.validate2FA(user.key, CodeType.Login, logInData.token)
                if (data.status !== 'verified') {
                    return data
                }
            }
        }

        return AuthService.generateToken(user, options)
    }

    static async refreshToken(userKey?: string) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'refreshToken', {}))
        }
        const accessToken = AuthModel.createAccessToken(userKey)
        const refreshToken = AuthModel.createRefreshToken(userKey)
        await AuthService.updateTokenVersion(userKey)
        return {
            token: accessToken,
            refreshToken
        }
    }

    static async updateTokenVersion(key?: string) {
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'updateTokenVersion', {}))
        }
        const currentTimestamp = generateUnixTimestamp()
        user.set('token_version', currentTimestamp, Number)
        await user.save()
        return { success: true }
    }

    static async authorizeByPhone(params: AuthorizeDto, options?: any) {
        const phoneInfo = getPhoneInfo(params.owner)
        const codeParams: VerifyUserAuthCodeDto = { type: UserAuthCodeType.Phone, owner: params.owner, code: params.code }
        await UserAuthCodeService.verifyCode(codeParams)

        let user = await UserModel.findOne({ phone: params.owner, removed: false }).exec()
        if (!user) {
            const setting: ISetting = await SettingService.getGlobalSetting()
            const mfaSettings = { type: MFAType.SMS, login_enabled: setting.login_require_mfa, withdraw_enabled: setting.withdraw_require_mfa }
            user = new UserModel({
                key: undefined,
                chat_name: await UserModel.generateRandomChatName(),
                phone: params.owner,
                phone_verified: true,
                player_id: params.player_id,
                source: 'phone',
                country: phoneInfo.country,
                role: 0,
                mfa_settings: mfaSettings
            })

            if (user.key) {
                await AccountService.initUserAccounts(user.key)
            }
            await user.save()
        }
        return AuthService.generateToken(user, options)
    }

    static async authorizeByEmail(params: AuthorizeDto, options?: any) {
        const codeParams: VerifyUserAuthCodeDto = { type: UserAuthCodeType.Email, owner: params.owner, code: params.code }
        await UserAuthCodeService.verifyCode(codeParams)

        let user = await UserModel.findOne({ email: params.owner, removed: false }).exec()
        if (!user) {
            const setting: ISetting = await SettingService.getGlobalSetting()
            const mfaSettings = { type: MFAType.EMAIL, login_enabled: setting.login_require_mfa, withdraw_enabled: setting.withdraw_require_mfa }

            const defaultChatname = first(params.owner.split('@'))
            user = new UserModel({
                key: undefined,
                email: params.owner,
                email_verified: true,
                chat_name: await UserModel.generateRandomChatName(defaultChatname),
                player_id: params.player_id,
                source: 'email',
                role: 0,
                mfa_settings: mfaSettings
            })

            if (user.key) {
                await AccountService.initUserAccounts(user.key)
            }
            await user.save()
        }
        return AuthService.generateToken(user, options)
    }

    static async authorizeViaGoogle(logInData: AuthorizeDto, options?: any) {
        // Follow docs: https://developers.google.com/identity/sign-in/android/backend-auth
        const { code } = logInData

        const { OAuth2Client } = require('google-auth-library')
        const client = new OAuth2Client(config.google.CLIENT_ID)

        const ticket = await client.verifyIdToken({
            idToken: code,
            audience: config.google.CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        })
        const payload = ticket.getPayload()
        const { sub, email, name, picture } = payload

        let user = await UserModel.findOne({ email: email, removed: false }).exec()
        if (!user) {
            user = new UserModel()
            user.email = email
            user.avatar = picture
            user.source = 'google'
            if (user.key) {
                await AccountService.initUserAccounts(user.key)
            }
            await user.save()
        }
        return AuthService.generateToken(user, options)
    }

    static async authorizeViaApple(logInData: AuthorizeDto, options?: any) {
        const jwt = require('jsonwebtoken')

        const { code } = logInData
        const { header } = jwt.decode(code, { complete: true })

        const kid = header.kid
        const publicKey = (await AuthService.key(kid)).getPublicKey()

        const { sub, email } = jwt.verify(code, publicKey)

        let user = await UserModel.findOne({ email: email, removed: false }).exec()
        if (!user) {
            user = new UserModel()
            user.email = email
            user.source = 'apple'
            if (user.key) {
                await AccountService.initUserAccounts(user.key)
            }
            await user.save()
        }

        return AuthService.generateToken(user, options)
    }

    static async key(kid: any) {
        const jwksClient = require('jwks-rsa')
        const client = jwksClient({
            jwksUri: 'https://appleid.apple.com/auth/keys',
            timeout: 30000
        })

        return await client.getSigningKey(kid)
    }

    static async generateToken(user: any, options?: any) {
        if (user.status === UserStatus.Locked || user.status === UserStatus.Suspend) {
            throw new BizException(AuthErrors.user_locked_error, new ErrorContext('auth.service', 'generateToken', { key: user.key }))
        }
        const currentTimestamp = generateUnixTimestamp()
        // create token
        const accessToken = AuthModel.createAccessToken(user.key)
        const refreshToken = AuthModel.createRefreshToken(user.key)
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

        return { user: user, token: accessToken, refreshToken }
    }
}
