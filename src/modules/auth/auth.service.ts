import * as bcrypt from 'bcrypt'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { CreateUserDto } from '@modules/user/user.dto'
import { LogInDto } from './auth.dto'
import { capitalize, escapeRegExp, toLower, trim } from 'lodash'
import UserModel from '@modules/user/user.model'
import { VerificationCode } from '@modules/verification_code/code.model'
import { AuthErrors } from '@exceptions/custom.error'
import UserSecurityModel from '@modules/user_security/user_security.model'
import { AuthModel } from './auth.model'
import SettingService from '@modules/setting/setting.service'
import { getPhoneInfo } from '@utils/phoneNumber'
import { generateUnixTimestamp } from '@utils/utility'
import { SecurityActions } from '@modules/user_security/user_security.interface'
import SecurityService from '@modules/security/security.service'
import { ISetting } from '@modules/setting/setting.interface'
import { CodeType, UserStatus } from '@config/constants'

export default class AuthService {
    protected static async formatCreateUserDto(userData: CreateUserDto) {
        userData.first_name = capitalize(escapeRegExp(trim(userData.first_name)))
        userData.last_name = capitalize(escapeRegExp(trim(userData.last_name)))
        userData.chat_name = await UserModel.generateRandomChatName(userData.first_name)
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
            $or: [
                { email: userData.email }, //
                userData.phone ? { phone: userData.phone } : {}
            ],
            removed: false
        }
        const user = await UserModel.findOne(filter).select('key email phone').exec()
        if (!user) {
            return { success: true }
        }

        if (userData?.email === user.email) {
            throw new BizException(
                AuthErrors.registration_email_exists_error,
                new ErrorContext('auth.service', 'verifyRegistration', { email: userData.email })
            )
        }

        if (userData?.phone === user.phone) {
            throw new BizException(
                AuthErrors.registration_phone_exists_error,
                new ErrorContext('auth.service', 'verifyRegistration', { phone: userData.phone })
            )
        }
    }

    static async logIn(logInData: LogInDto, options?: any) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ email: logInData.email, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'logIn', { email: logInData.email }))
        }

        if (user.status === UserStatus.Locked) {
            throw new BizException(AuthErrors.user_locked_error, new ErrorContext('user.service', 'logIn', { email: logInData.email }))
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
        const accessToken = AuthModel.createAccessToken(user.key, currentTimestamp)

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

    static async refreshToken(userKey: string) {
        const currentTimestamp = generateUnixTimestamp()
        const user = await UserModel.findOne({ key: userKey, removed: false }).exec()
        if (!user) {
            throw new BizException(AuthErrors.credentials_invalid_error, new ErrorContext('auth.service', 'refreshToken', {}))
        }
        const accessToken = AuthModel.createAccessToken(userKey, currentTimestamp)
        await AuthService.updateTokenVersion(userKey, currentTimestamp)
        return {
            token: accessToken
        }
    }

    static async updateTokenVersion(key: string, currentTimestamp: number) {
        const user = await UserModel.findOne({ key }).exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('auth.service', 'updateTokenVersion', {}))
        }
        user.set('token_version', currentTimestamp, Number)
        await user.save()
        return { success: true }
    }
}
