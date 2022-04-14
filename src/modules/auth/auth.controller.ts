import asyncHandler from '../../common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '../../interfaces/controller.interface'
import validationMiddleware from '../../middlewares/validation.middleware'
import AuthService from './auth.service'
import { CreateUserDto } from '../user/user.dto'
import { ForgotPasswordDto, LogInDto, ResetPasswordDto } from './auth.dto'
import { requireAuth } from '../../common/authCheck'

export default class AuthController implements IController {
    public path = '/auth'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), asyncHandler(this.register))
        this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), asyncHandler(this.logIn))
        this.router.post(`${this.path}/logout`, requireAuth, asyncHandler(this.logOut))

        this.router.post(`${this.path}/password/reset`, requireAuth, validationMiddleware(ResetPasswordDto), asyncHandler(this.resetPassword))
        this.router.post(`${this.path}/password/forgot`, validationMiddleware(ForgotPasswordDto), asyncHandler(this.forgotPassword))
    }

    private register = async (req: Request, res: Response) => {
        const userData: CreateUserDto = req.body
        const data = await AuthService.register(userData)

        return res.send(data)
    }

    private logIn = async (req: Request, res: Response) => {
        const logInData: LogInDto = req.body
        const data = await AuthService.logIn(logInData)

        return res.send(data)
    }

    private resetPassword = async (req: Request, res: Response) => {
        const passwordData: ResetPasswordDto = req.body
        const data = await AuthService.resetPassword(passwordData, req.user)

        return res.send(data)
    }

    private forgotPassword = async (req: Request, res: Response) => {
        const authData: ForgotPasswordDto = req.body
        const data = await AuthService.forgotPassword(authData)

        return res.send(data)
    }

    private logOut = async (req: Request, res: Response) => {
        // const postData: any = req.body;
        // const data = await AuthService.logOut(postData)

        return res.send(req.user)
    }
}
