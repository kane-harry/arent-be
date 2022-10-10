import { Response } from 'express'
import { CreateUserDto } from '@modules/user/user.dto'
import { LogInDto } from './auth.dto'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import AuthService from './auth.service'
import { generateUnixTimestamp } from '@utils/utility'

export default class AuthController {
    static async verifyRegistration(req: CustomRequest, res: Response) {
        const userData: CreateUserDto = req.body
        const data = await AuthService.verifyRegistration(userData)

        return res.send(data)
    }

    static async logIn(req: CustomRequest, res: Response) {
        const logInData: LogInDto = req.body
        const data = await AuthService.logIn(logInData, { req })

        return res.send(data)
    }

    static async logOut(req: AuthenticationRequest, res: Response) {
        const data = await AuthService.updateTokenVersion(req.user?.key)
        return res.send(data)
    }

    static async refreshToken(req: AuthenticationRequest, res: Response) {
        const data = await AuthService.refreshToken(req.user.key)
        res.send(data)
    }
}
