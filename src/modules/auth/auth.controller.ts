import asyncHandler from '@common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CreateUserDto } from '@modules/user/user.dto'
import { ForgotPasswordDto, ForgotPinDto, LogInDto, RefreshTokenDto, ResetPasswordDto, ResetPinDto } from './auth.dto'
import { requireAuth } from '@common/authCheck'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import AuthService from './auth.service'

export default class AuthController implements IController {
    public path = '/auth'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/registration/verify`, validationMiddleware(CreateUserDto), asyncHandler(this.verifyRegistration))
        this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), asyncHandler(this.register))
        this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), asyncHandler(this.logIn))
        this.router.post(`${this.path}/token/refresh`, validationMiddleware(RefreshTokenDto), asyncHandler(this.refreshToken))
        this.router.post(`${this.path}/logout`, requireAuth, validationMiddleware(RefreshTokenDto), asyncHandler(this.logOut))

        this.router.post(`${this.path}/password/reset`, requireAuth, validationMiddleware(ResetPasswordDto), asyncHandler(this.resetPassword))
        this.router.post(`${this.path}/password/forgot`, validationMiddleware(ForgotPasswordDto), asyncHandler(this.forgotPassword))

        this.router.post(`${this.path}/pin/reset`, requireAuth, validationMiddleware(ResetPinDto), asyncHandler(this.resetPin))
        this.router.post(`${this.path}/pin/forgot`, validationMiddleware(ForgotPinDto), asyncHandler(this.forgotPin))
    }

    private verifyRegistration = async (req: CustomRequest, res: Response) => {
        const userData: CreateUserDto = req.body
        const data = await AuthService.verifyRegistration(userData, { req })

        return res.send(data)
    }

    private register = async (req: CustomRequest, res: Response) => {
        const userData: CreateUserDto = req.body
        const data = await AuthService.register(userData, { req })

        return res.send(data)
    }

    private logIn = async (req: CustomRequest, res: Response) => {
        const logInData: LogInDto = req.body
        const data = await AuthService.logIn(logInData, { req })

        return res.send(data)
    }

    private refreshToken = async (req: Request, res: Response) => {
        const tokenData: RefreshTokenDto = req.body
        const data = await AuthService.refreshToken(tokenData)
        return res.send(data)
    }

    private resetPassword = async (req: AuthenticationRequest, res: Response) => {
        const passwordData: ResetPasswordDto = req.body
        const data = await AuthService.resetPassword(passwordData, req.user, { req })

        return res.send(data)
    }

    private forgotPassword = async (req: AuthenticationRequest, res: Response) => {
        const authData: ForgotPasswordDto = req.body
        const data = await AuthService.forgotPassword(authData, { req })

        return res.send(data)
    }

    private resetPin = async (req: AuthenticationRequest, res: Response) => {
        const passwordData: ResetPinDto = req.body
        const data = await AuthService.resetPin(passwordData, req.user, { req })

        return res.send(data)
    }

    private forgotPin = async (req: AuthenticationRequest, res: Response) => {
        const authData: ForgotPinDto = req.body
        const data = await AuthService.forgotPin(authData, { req })

        return res.send(data)
    }

    private logOut = async (req: Request, res: Response) => {
        const tokenData: RefreshTokenDto = req.body
        const data = await AuthService.logOut(tokenData)
        return res.send(data)
    }
}
