import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import { requireAuth } from '@utils/authCheck'
import ICustomRouter from '@interfaces/custom.router.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CreateUserDto } from '@modules/user/user.dto'
import { LogInDto } from './auth.dto'
import AuthController from './auth.controller'

export default class AuthRouter implements ICustomRouter {
    public path = '/auth'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/registration/verify`, validationMiddleware(CreateUserDto), asyncHandler(AuthController.verifyRegistration))
        this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), asyncHandler(AuthController.logIn))
        this.router.post(`${this.path}/token/refresh`, requireAuth, asyncHandler(AuthController.refreshToken))
        this.router.post(`${this.path}/logout`, requireAuth, asyncHandler(AuthController.logOut))
    }
}
