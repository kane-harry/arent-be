import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import VerificationCodeController from './code.controller'

export default class VerificationCodeRouter implements ICustomRouter {
    public path = '/verification'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/code/generate`, validationMiddleware(CreateCodeDto), asyncHandler(VerificationCodeController.generateCode))
        this.router.post(`${this.path}/code/verify`, validationMiddleware(VerifyCodeDto), asyncHandler(VerificationCodeController.verifyCode))
    }
}
