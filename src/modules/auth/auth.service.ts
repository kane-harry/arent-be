import * as bcrypt from 'bcrypt'
import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'
import { CreateUserDto, UserDto } from '../user/user.dto'
import { ForgotPasswordDto, LogInDto, ResetPasswordDto } from './auth.dto'
import { toLower, capitalize, escapeRegExp, trim } from 'lodash'
import { IUser, UserStatus } from '../user/user.interface'
import UserModel from '../user/user.model'
import { VerificationCode } from '../verification_code/code.model'
import { CodeType } from '../verification_code/code.interface'
import { AuthErrors } from '../../exceptions/custom.error'
import * as jwt from 'jsonwebtoken'
import { config } from '../../config'
import VerificationCodeService from '../verification_code/code.service'

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
            avatar: '',
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

    static async resetPassword(passwordData: ResetPasswordDto, _user: UserDto | undefined) {
        if (passwordData.newPasswordConfirmation !== passwordData.newPassword) {
            throw new BizException(
                { message: 'Password confirmation mismatch.', status: 422, code: 422 },
                new ErrorContext('auth.service', 'resetPassword', {})
            )
        }

        const user = await UserModel.findOne({ email: _user?.email }).exec()

        const isPasswordMatching = await bcrypt.compare(passwordData.oldPassword, String(user?.get('password', null, { getters: false })))
        if (!isPasswordMatching) {
            throw new BizException(
                { message: 'Wrong credentials provided.', status: 400, code: 400 },
                new ErrorContext('auth.service', 'resetPassword', {})
            )
        }
        user?.set('password', await bcrypt.hash(passwordData.newPassword, 10), String)
        user?.save()

        // TODO: add user events log

        return { success: true }
    }

    static async forgotPassword(passwordData: ForgotPasswordDto) {
        const { success } = await VerificationCodeService.verifyCode({
            ...passwordData,
            codeType: CodeType.ForgotPassword
        })
        if (!success) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('auth.service', 'generateCode', { email: passwordData.email })
            )
        }

        const user = await UserModel.findOne({ email: passwordData?.email }).exec()

        if (!user) {
            throw new BizException(
                { message: 'Wrong credentials provided.', status: 400, code: 400 },
                new ErrorContext('auth.service', 'forgotPassword', {})
            )
        }

        user?.set('password', await bcrypt.hash(passwordData.newPassword, 10), String)
        user?.save()

        // TODO: add user events log

        return { success: true }
    }

    static async logOut(id: string) {
        throw new BizException(
            { message: 'Not implemented.', status: 400, code: 400 },
            new ErrorContext('transaction.service', 'getTransactionById', {})
        )
    }
}
