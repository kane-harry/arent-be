import asyncHandler from '@common/asyncHandler'
import { Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CustomRequest } from '@middlewares/request.middleware'
import PaymentService from './payment.service'
import { DepositDto } from '@modules/payment/payment.dto'
import mongoose from 'mongoose'
import UserModel from '@modules/user/user.model'
import AccountModel from '@modules/account/account.model'
import BizException from '@exceptions/biz.exception'
import { DepositErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import SettingService from '@modules/setting/setting.service'
import { requireAuth } from '@common/authCheck'

class PaymentController implements IController {
    public path = '/payments'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}/deposit`, requireAuth, validationMiddleware(DepositDto), asyncHandler(this.deposit))
    }

    private async deposit(req: CustomRequest, res: Response) {
        const params: DepositDto = req.body
        // @ts-ignore
        params.user = await UserModel.findOne({ email: req?.user?.email }).exec()
        params.account = await AccountModel.findOne({ key: params.accountKey }).select('-keyStore -salt').exec()
        params.ipAddress = req.connection?.remoteAddress
        params.setting = await SettingService.getGlobalSetting()
        params.amount = parseFloat(params.amount)
        if (!params.user || !params.account || params.user.key !== params.account.userId) {
            throw new BizException(
                DepositErrors.account_is_not_exist,
                new ErrorContext('payment.controller', 'deposit', { type: params.accountKey })
            )
        }
        if (params.setting.depositRequiredKycValidation && !params.user.kycVerified) {
            throw new BizException(
                DepositErrors.depositRequiredKycValidation,
                new ErrorContext('stripe.controller', 'deposit', { depositRequiredKycValidation: params.setting.depositRequiredKycValidation })
            )
        }
        if (!params.account.symbol.includes('USD')) {
            throw new BizException(
                DepositErrors.accountIsNotUSD,
                new ErrorContext('stripe.controller', 'deposit', { symbol: params.account.symbol })
            )
        }
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
            const data = await PaymentService.deposit(params)
            return res.json(data)
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }
}

export default PaymentController
