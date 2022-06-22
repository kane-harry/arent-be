import { DepositDto } from '@modules/payment/payment.dto'
import { DepositType } from '@modules/payment/payment.interface'
import StripeService from '@modules/payment/stripe/stripe.service'
import BizException from '@exceptions/biz.exception'
import { DepositErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import sendEmail from '@common/email'

export default class PaymentService {
    static async deposit(depositDto: DepositDto) {
        let data
        switch (depositDto.depositType) {
        case DepositType.Stripe: {
            data = await StripeService.deposit(depositDto)
            break
        }
        default: {
            throw new BizException(
                DepositErrors.deposit_type_not_supported,
                new ErrorContext('payment.service', 'deposit', { depositType: depositDto.depositType })
            )
        }
        }
        const html = `Deposit success full via Stripe, deposit: ${depositDto.amount} USD, account increase ${data.amount} ${depositDto.account.symbol}`
        await sendEmail('PellarGroup: Deposit successful', html, html, depositDto.user.email)
        return data
    }
}
