import asyncHandler from '../../common/asyncHandler'
import { Request, Response, Router } from 'express'
import validationMiddleware from '../../middlewares/validation.middleware'
import IController from '../../interfaces/controller.interface'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import VerificationCodeService from './code.service'

export default class VerificationCodeController implements IController {
    public path = '/verification'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/code/get`, validationMiddleware(CreateCodeDto), asyncHandler(this.generateCode))
        this.router.post(`${this.path}/code/verify`, validationMiddleware(VerifyCodeDto), asyncHandler(this.verifyCode))
    }

    private generateCode = async (req: Request, res: Response) => {
        const params: CreateCodeDto = req.body
        const data = await VerificationCodeService.generateCode(params)

        return res.send(data)
    }

    private verifyCode = async (req: Request, res: Response) => {
        const params: VerifyCodeDto = req.body
        const data = await VerificationCodeService.verifyCode(params)

        return res.send(data)
    }
}
