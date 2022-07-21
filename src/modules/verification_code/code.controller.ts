import asyncHandler from '@utils/asyncHandler'
import { Request, Response, Router } from 'express'
import validationMiddleware from '@middlewares/validation.middleware'
import IController from '@interfaces/controller.interface'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import VerificationCodeService from './code.service'
import { CodeType } from './code.interface'
import BizException from '@exceptions/biz.exception'
import { VerificationCodeErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import sendSms from '@utils/sms'
import EmailService from '@modules/emaill/email.service'

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
        if (!allowTypes.includes(params.code_type)) {
            throw new BizException(
                VerificationCodeErrors.verification_code_type_not_supported,
                new ErrorContext('auth.service', 'generateCode', { ...params })
            )
        }

        const data = await VerificationCodeService.generateCode(params)
        if (data.success && data.code) {
            if (params.code_type === CodeType.EmailRegistration) {
                EmailService.sendRegistrationVerificationCode({ address: data.owner, code: data.code })
            } else if (params.code_type === CodeType.EmailUpdate) {
                EmailService.sendChangeEmailVerificationCode({ address: data.owner, code: data.code })
            } else {
                const subject = 'LightLink'
                const smsContent =
                    params.code_type === CodeType.PhoneRegistration
                        ? `[LightLink] Please use this verification code: ${data.code} to complete registration in 15 minutes.`
                        : `[LightLink] Please use this verification code: ${data.code} to update your phone number in 15 minutes.`
                sendSms(subject, smsContent, data.owner)
            }
        }

        return res.send({ success: true })
    }

    private verifyCode = async (req: Request, res: Response) => {
        const params: VerifyCodeDto = req.body

        const allowTypes = [CodeType.EmailRegistration, CodeType.PhoneRegistration, CodeType.EmailUpdate, CodeType.PhoneUpdate]
        if (!allowTypes.includes(params.code_type)) {
            throw new BizException(
                VerificationCodeErrors.verification_code_type_not_supported,
                new ErrorContext('auth.service', 'generateCode', { ...params })
            )
        }
        const data = await VerificationCodeService.verifyCode(params)

        return res.send(data)
    }
}
