import { DepositDto } from '@modules/payment/payment.dto'
import { StripeDepositType } from '@modules/payment/payment.interface'
import BizException from '@exceptions/biz.exception'
import { DepositErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import BlockchainService from '@modules/blockchain/blockchain.service'
import Stripe from './stripe'
import { roundUp } from '@common/utility'
const floor10 = require('round10').floor10

export default class StripeService {
    static async deposit(depositDto: DepositDto) {
        const setting = depositDto.setting
        if (setting.depositStripeDisabled) {
            throw new BizException(
                DepositErrors.deposit_stripe_disabled,
                new ErrorContext('stripe.service', 'deposit', { depositStripeDisabled: setting.depositStripeDisabled })
            )
        }
        let data
        switch (depositDto.type) {
        case StripeDepositType.STOREDCARD: {
            data = StripeService.depositStoreCard(depositDto)
            break
        }
        case StripeDepositType.CARD: {
            data = StripeService.depositCardToken(depositDto)
            break
        }
        default: {
            throw new BizException(
                DepositErrors.deposit_type_not_supported,
                new ErrorContext('stripe.service', 'deposit', { type: depositDto.type })
            )
        }
        }
        return data
    }

    static async depositStoreCard(depositDto: DepositDto) {
        if (!depositDto.user.stripeId) {
            throw new BizException(
                DepositErrors.account_deposit_stripe_id_null,
                new ErrorContext('stripe.service', 'depositStoreCard', { type: depositDto.type })
            )
        }
        const amountToCharge = floor10(depositDto.amount * 100, 0)
        const stripeTransactionReference = await Stripe.chargeUserWithStoredCard(amountToCharge, depositDto.user.stripeId)
        const fee = roundUp(depositDto.amount * depositDto.setting.stripDepositFeeRate, 2) + depositDto.setting.stripDepositFeePerTransaction
        const amountWithoutFee = roundUp(depositDto.amount - fee, 2)
        return await BlockchainService.increaseAmount(depositDto.account.extKey, amountWithoutFee.toString(), 'DEPOSIT', `Deposited:${depositDto.amount} USD, Stripe txn id:${stripeTransactionReference},Received:${amountWithoutFee} USD, Fees:${fee} USD`)
    }

    static async depositCardToken(depositDto: DepositDto) {
        const customerIdToStore = await Stripe.createCustomerWithToken(depositDto.user.email, depositDto.cardToken)
        const amountToCharge = floor10(depositDto.amount * 100, 0)
        const stripeTransactionReference = await Stripe.chargeUserWithStoredCard(amountToCharge, customerIdToStore)
        await StripeService.updateStripeID(depositDto, customerIdToStore)
        const fee = roundUp(depositDto.amount * depositDto.setting.stripDepositFeeRate, 2) + depositDto.setting.stripDepositFeePerTransaction
        const amountWithoutFee = roundUp(depositDto.amount - fee, 2)
        return await BlockchainService.increaseAmount(depositDto.account.extKey, amountWithoutFee.toString(), 'DEPOSIT', `Deposited:${depositDto.amount} USD, Stripe txn id:${stripeTransactionReference},Received:${amountWithoutFee} USD, Fees:${fee} USD`)
    }

    static async updateStripeID(depositDto: DepositDto, stripeId:any) {
        const user = depositDto.user
        user.stripeId = stripeId
        await user.save()
    }
}
