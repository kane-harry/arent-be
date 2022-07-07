import asyncHandler from '@utils/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CreateUserDto } from '@modules/user/user.dto'
import { ForgotPasswordDto, ForgotPinDto, LogInDto, RefreshTokenDto, ResetPasswordDto, ResetPinDto } from './auth.dto'
import { requireAuth } from '@utils/authCheck'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import AuthService from './auth.service'
import { requireAdmin } from '@config/role'

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
        this.router.post(`${this.path}/tokenversion/refresh`, requireAuth, asyncHandler(this.refreshToken))
        this.router.post(`${this.path}/logout`, requireAuth, asyncHandler(this.logOut))
        this.router.get(`${this.path}/current`, requireAuth, asyncHandler(this.getCurrentUser))

        this.router.post(`${this.path}/password/forgot`, validationMiddleware(ForgotPasswordDto), asyncHandler(this.forgotPassword))
        this.router.post(`${this.path}/password/reset`, validationMiddleware(ResetPasswordDto), asyncHandler(this.resetPassword))

        this.router.post(`${this.path}/pin/forgot`, validationMiddleware(ForgotPinDto), asyncHandler(this.forgotPin))
        this.router.post(`${this.path}/pin/reset`, validationMiddleware(ResetPinDto), asyncHandler(this.resetPin))
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

    private logOut = async (req: AuthenticationRequest, res: Response) => {
        const data = await AuthService.updateTokenVersion(req.user?.key)
        return res.send(data)
    }

    private refreshToken = async (req: AuthenticationRequest, res: Response) => {
        const data = await AuthService.updateTokenVersion(req.user?.key)
        res.send(data)
    }

    private getCurrentUser = async (req: AuthenticationRequest, res: Response) => {
        const userKey = req.user.key
        const data = await AuthService.getCurrentUser(userKey)
        return res.send(data)
    }

    private forgotPassword = async (req: Request, res: Response) => {
        const params: ForgotPasswordDto = req.body
        const data = await AuthService.forgotPassword(params)

        return res.send(data)
    }

    private resetPassword = async (req: Request, res: Response) => {
        const params: ResetPasswordDto = req.body
        const data = await AuthService.resetPassword(params)

        return res.send(data)
    }

    private forgotPin = async (req: AuthenticationRequest, res: Response) => {
        const params: ForgotPinDto = req.body
        const data = await AuthService.forgotPin(params)

        return res.send(data)
    }

    private resetPin = async (req: AuthenticationRequest, res: Response) => {
        const params: ResetPinDto = req.body
        const data = await AuthService.resetPin(params)

        return res.send(data)
    }
}
