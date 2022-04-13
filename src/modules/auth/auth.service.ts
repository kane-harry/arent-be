import * as bcrypt from 'bcrypt'
import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'
import { CreateUserDto } from '../user/user.dto'
import { CreateCodeDto, LogInDto, VerifyCodeDto } from './auth.dto'
import { toLower, capitalize, escapeRegExp, trim } from 'lodash'
import { IUser, UserStatus } from '../user/user.interface'
import UserModel from '../user/user.model'
import CodeModel from './code.model'
import { CodeType } from './code.interface'
import { AuthErrors } from '../../exceptions/custom.error'
import * as jwt from 'jsonwebtoken'
import { config } from '../../config'
import randomstring from 'randomstring'
import moment from 'moment'

export default class AuthService {
    static async generateCode(params: CreateCodeDto) {
        const email = toLower(trim(params.email))
        const user = await UserModel.findOne({ email: params.email }).exec()
        if (user) {
            if (params.codeType === CodeType.EmailRegistration) {
                throw new BizException(AuthErrors.registration_email_exists_error, new ErrorContext('auth.service', 'generateCode', { email: email }))
            }
            if (user.emailVerified && params.codeType === CodeType.EmailUpdating) {
                throw new BizException(
                    AuthErrors.registration_email_already_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: email })
                )
            }
        }
        const code = randomstring.generate({ length: 6, charset: 'numeric' })
        const codeData = await CodeModel.findOne({ owner: email, type: params.codeType }).exec()
        const currentTs = moment().unix()
        if (codeData) {
            if (codeData.sentAttempts <= 5 && codeData.sentTimestamp > currentTs - 60) {
                throw new BizException(
                    AuthErrors.verification_code_duplicate_request_in_minute_error,
                    new ErrorContext('auth.service', 'generateCode', { email: email })
                )
            } else if (codeData.sentAttempts > 5 && codeData.sentTimestamp > currentTs - 3600) {
                throw new BizException(
                    AuthErrors.verification_code_duplicate_request_in_hour_error,
                    new ErrorContext('auth.service', 'generateCode', { email: email })
                )
            }
            const newExpireTimestamp = currentTs + 900
            await CodeModel.findByIdAndUpdate(codeData._id, {
                code: code,
                expiryTimestamp: newExpireTimestamp,
                sentAttempts: codeData.sentAttempts++
            }).exec()
        } else {
            const mode = new CodeModel({
                owner: email,
                type: params.codeType,
                code: code
            })
            await mode.save()
        }
        // TODO: send email

        return { success: true }
    }

    static async verifyCode(params: VerifyCodeDto) {
        const codeData = await CodeModel.findOne({ owner: params.email, type: params.codeType, code: params.code }).exec()

        if (!codeData) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('auth.service', 'generateCode', { code: params.code })
            )
        }
        const currentTs = moment().unix()
        if (!codeData.enabled || codeData.expiryTimestamp < currentTs) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('auth.service', 'generateCode', { code: params.code })
            )
        }
        const valid = codeData.code === params.code
        if (valid) {
            await CodeModel.findByIdAndUpdate(codeData._id, { enabled: false }).exec()
        } else {
            const retryAttempts = codeData.retryAttempts + 1
            const codeEnabled = retryAttempts > 5
            await CodeModel.findByIdAndUpdate(codeData._id, { retryAttempts: retryAttempts, enabled: codeEnabled }).exec()
        }

        return { success: valid }
    }

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
            const codeData = await CodeModel.findOne({ owner: userData.email, type: CodeType.EmailRegistration }).exec()
            if (!codeData || codeData.enabled) {
                throw new BizException(
                    AuthErrors.registration_email_not_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: userData.email })
                )
            }
        }

        // const salt = await bcrypt.genSalt(10)
        const mode = new UserModel({
            ...userData,
            password: await bcrypt.hash(userData.password, 10),
            pin: await bcrypt.hash(userData.pin, 10),
            avatar: 'avatars/avatar.jpg', // default avatar
            status: UserStatus.Normal
        })
        const savedData = await mode.save()
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

    static async logIn(logInData: LogInDto) {
        const user = await UserModel.findOne({ email: logInData.email }).exec()
        if (user) {
            const isPasswordMatching = await bcrypt.compare(logInData.password, user.get('password', null, { getters: false }))
            if (isPasswordMatching) {
                // create token
                const token = AuthService.createToken(user)

                return { user: user, token: token }
            }
            throw new BizException({ message: 'Wrong credentials provided.', status: 400, code: 400 }, new ErrorContext('auth.service', 'logIn', {}))
        } else {
            throw new BizException({ message: 'Wrong credentials provided.', status: 400, code: 400 }, new ErrorContext('auth.service', 'logIn', {}))
        }
    }

    private static createToken(user: IUser) {
        const expiresIn = config.JWT.tokenExpiresIn
        const secret = String(config.JWT.secret)
        const payload = {
            id: user._id
        }
        return jwt.sign(payload, secret, { expiresIn })
    }

    static async logOut(id: string) {
        throw new BizException(
            { message: 'Not implemented.', status: 400, code: 400 },
            new ErrorContext('transaction.service', 'getTransactionById', {})
        )
    }
}
