import asyncHandler from '@utils/asyncHandler'
import { Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CreateUserDto } from '@modules/user/user.dto'
import { LogInDto } from './auth.dto'
import { requireAuth } from '@utils/authCheck'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import AuthService from './auth.service'
import { generateUnixTimestamp } from '@utils/utility'

export default class AuthController implements IController {
    public path = '/auth'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/registration/verify`, validationMiddleware(CreateUserDto), asyncHandler(this.verifyRegistration))
        this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), asyncHandler(this.logIn))
        this.router.post(`${this.path}/token/refresh`, requireAuth, asyncHandler(this.refreshToken))
        this.router.post(`${this.path}/logout`, requireAuth, asyncHandler(this.logOut))
    }

    private verifyRegistration = async (req: CustomRequest, res: Response) => {
        const userData: CreateUserDto = req.body
        const data = await AuthService.verifyRegistration(userData)

        return res.send(data)
    }

    private logIn = async (req: CustomRequest, res: Response) => {
        const logInData: LogInDto = req.body
        const data = await AuthService.logIn(logInData, { req })

        return res.send(data)
    }

    private logOut = async (req: AuthenticationRequest, res: Response) => {
        const currentTimestamp = generateUnixTimestamp()
        const data = await AuthService.updateTokenVersion(req.user?.key, currentTimestamp)
        return res.send(data)
    }

    private refreshToken = async (req: AuthenticationRequest, res: Response) => {
        const data = await AuthService.refreshToken(req.user.key)
        res.send(data)
    }
}
