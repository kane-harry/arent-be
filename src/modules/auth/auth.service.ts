import * as bcrypt from 'bcrypt'
import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'
import { CreateUserDto } from '../user/user.dto'
import LogInDto from './login.dto'
import { toLower, capitalize, escapeRegExp, trim } from 'lodash'
import { IUser, UserStatus } from '../user/user.interface'
import UserModel from '../user/user.model'
import { AuthErrors } from '../../exceptions/custom.error'
import * as jwt from 'jsonwebtoken'

export default class AuthService {
    static register = async (userData: CreateUserDto) => {
        userData = AuthService.formatCreateUserDto(userData)
        const user = await UserModel.findOne({ email: userData.email })
        if (user) {
            throw new BizException(
                AuthErrors.registration_email_exists_error,
                new ErrorContext('auth.service', 'register', { email: userData.email })
            )
        }

        const salt = await bcrypt.genSalt(10)
        const mode = new UserModel({
            ...userData,
            password: await bcrypt.hash(userData.password, salt),
            pin: await bcrypt.hash(userData.pin, salt),
            avatar: 'avatars/avatar.jpg', // default avatar
            status: UserStatus.Normal
        })
        const savedData = await mode.save()
        const token = await AuthService.createToken(savedData)

        return { user: savedData, token: token }
    }

    private static formatCreateUserDto = (userData: CreateUserDto) => {
        userData.firstName = capitalize(escapeRegExp(userData.firstName))
        userData.lastName = capitalize(escapeRegExp(userData.lastName))
        userData.nickName = capitalize(escapeRegExp(userData.nickName))
        userData.email = toLower(userData.email)
        userData.password = trim(userData.password)
        userData.pin = trim(userData.pin)
        return userData
    }

    static logIn = async (logInData: LogInDto) => {
        const user = await UserModel.findOne({ email: logInData.email })
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
        const expiresIn = '7d'
        const secret = String(process.env.JWT_SECRET)
        const payload = {
            id: user._id
        }
        return jwt.sign(payload, secret, { expiresIn })
    }

    static logOut = async (id: string) => {
        throw new BizException(
            { message: 'Not implemented.', status: 400, code: 400 },
            new ErrorContext('transaction.service', 'getTransactionById', {})
        )
    }
}
