import asyncHandler from '@utils/asyncHandler'
import { Request, Response, Router } from 'express'
import validationMiddleware from '@middlewares/validation.middleware'
import IController from '@interfaces/controller.interface'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import VerificationCodeService from './code.service'
import EmailService from '@modules/emaill/email.service'
import { CodeType } from './code.interface'
import BizException from '@exceptions/biz.exception'
import { VerificationCodeErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'

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

        const allowTypes = [CodeType.EmailRegistration, CodeType.PhoneRegistration, CodeType.EmailUpdate, CodeType.PhoneUpdate]
        if (!allowTypes.includes(params.codeType)) {
            throw new BizException(
                VerificationCodeErrors.verification_code_type_not_supported,
                new ErrorContext('auth.service', 'generateCode', { ...params })
            )
        }

        const data = await VerificationCodeService.generateCode(params)

        return res.send(data)
    }

    private verifyCode = async (req: Request, res: Response) => {
        const params: VerifyCodeDto = req.body

        const allowTypes = [CodeType.EmailRegistration, CodeType.PhoneRegistration, CodeType.EmailUpdate, CodeType.PhoneUpdate]
        if (!allowTypes.includes(params.codeType)) {
            throw new BizException(
                VerificationCodeErrors.verification_code_type_not_supported,
                new ErrorContext('auth.service', 'generateCode', { ...params })
            )
        }
        const data = await VerificationCodeService.verifyCode(params)

        return res.send(data)
    }
}
