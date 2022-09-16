import { Request, Response } from 'express'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import VerificationCodeService from './code.service'
import EmailService from '@modules/emaill/email.service'
import { CodeType } from '@config/constants'
import sendSms from '@utils/sms'

export default class VerificationCodeController {
    static async generateCode(req: Request, res: Response) {
        const params: CreateCodeDto = req.body

        const deliveryMethod = (owner: any, code: string) => {
            switch (params.code_type) {
                case CodeType.EmailRegistration:
                    EmailService.sendRegistrationVerificationCode({ address: owner, code })
                    break

                case CodeType.EmailUpdate:
                    EmailService.sendChangeEmailVerificationCode({ address: owner, code })
                    break

                case CodeType.PhoneRegistration:
                    sendSms('LightLink', `[LightLink] Please use this verification code: ${code} to complete registration in 15 minutes.`, owner)
                    break

                case CodeType.PhoneUpdate:
                    sendSms('LightLink', `[LightLink] Please use this verification code: ${code} to update your phone number in 15 minutes.`, owner)
                    break

                default:
                    break
            }
        }

        const data = await VerificationCodeService.generateCode(params, deliveryMethod)
        return res.send(data)
    }

    static async verifyCode(req: Request, res: Response) {
        const params: VerifyCodeDto = req.body
        const data = await VerificationCodeService.verifyCode(params)
        return res.send(data)
    }
}
