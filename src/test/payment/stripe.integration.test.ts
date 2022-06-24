// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS, validResponse} from '../init/db'
import server from '@app/server'
import {initDataForUser} from '@app/test/init/authenticate'
import {DepositType, StripeDepositType} from "@modules/payment/payment.interface";
import Stripe from "@modules/payment/stripe/stripe";
import SettingService from "@modules/setting/setting.service";
import {DepositErrors} from "@exceptions/custom.error";

chai.use(chaiAsPromised)
const { expect, assert } = chai
const cardInfo = {
    number: 4242424242424242,
    exp_month: 6,
    exp_year: 2023,
    cvc: 314,
}

let shareData = {
    user: {
        email: '',
        key: '',
    },
    token: '',
    accounts: []
}
const paymentData = {
    depositType: DepositType.Stripe,
    type: StripeDepositType.CARD,
    pin: '123456',
    amount: 500,
    accountKey: '',
    cardToken: ''
}

describe('Stripe Payment', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
    }).timeout(10000)

    it('GetAccountsByUser', async () => {
        const res = await request(server.app)
            .get(`/accounts/user/${shareData.user?.key}`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body).be.an('array')
        shareData.accounts = res.body
    }).timeout(10000)

    it('CreateCardToken', async () => {
       const res = await Stripe.createCardToken(cardInfo)
       paymentData.cardToken = res.id
    }).timeout(10000)

    it('Deposit Stripe: UnAuthorize', async () => {
        const account = shareData.accounts.filter(item => item.symbol.includes('USD'))[0]
        paymentData.accountKey = account.key
        paymentData.type = StripeDepositType.CARD
        const res = await request(server.app)
            .post(`/payments/deposit`)
            .send(paymentData)
        expect(res.status).equal(401)
    }).timeout(10000)

    it('Deposit Stripe: CARD', async () => {
        const account = shareData.accounts.filter(item => item.symbol.includes('USD'))[0]
        paymentData.accountKey = account.key
        paymentData.type = StripeDepositType.CARD
        const res = await request(server.app)
            .post(`/payments/deposit`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(paymentData)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.sender).equal(account.address)
        expect(res.body.recipient).equal(account.address)
        expect(res.body.type).equal('DEPOSIT')
        expect(res.body.amount).lt(paymentData.amount)
    }).timeout(10000)

    it('Deposit Stripe: STOREDCARD', async () => {
        const account = shareData.accounts.filter(item => item.symbol.includes('USD'))[0]
        paymentData.accountKey = account.key
        paymentData.type = StripeDepositType.STOREDCARD
        const res = await request(server.app)
            .post(`/payments/deposit`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(paymentData)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.sender).equal(account.address)
        expect(res.body.recipient).equal(account.address)
        expect(res.body.type).equal('DEPOSIT')
        expect(res.body.amount).lt(paymentData.amount)
    }).timeout(10000)

    it('Deposit Stripe: Wrong Account USD', async () => {
        const account = shareData.accounts.filter(item => !item.symbol.includes('USD'))[0]
        paymentData.accountKey = account.key
        const res = await request(server.app)
            .post(`/payments/deposit`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(paymentData)
        expect(res.status).equal(400)
        expect(res.body.code).equal(DepositErrors.accountIsNotUSD.code)
        expect(res.body.message).equal(DepositErrors.accountIsNotUSD.message)
    }).timeout(10000)

    it('Deposit Stripe: Deposit Required Kyc Validation', async () => {
        const setting = await SettingService.getGlobalSetting()
        setting.depositRequiredKycValidation = true
        await setting.save()

        const account = shareData.accounts.filter(item => item.symbol.includes('USD'))[0]
        paymentData.accountKey = account.key
        const res = await request(server.app)
            .post(`/payments/deposit`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(paymentData)
        expect(res.status).equal(400)
        expect(res.body.code).equal(DepositErrors.depositRequiredKycValidation.code)
        expect(res.body.message).equal(DepositErrors.depositRequiredKycValidation.message)
    }).timeout(10000)

    it('Deposit Stripe: Deposit Stripe Disabled', async () => {
        const setting = await SettingService.getGlobalSetting()
        setting.depositRequiredKycValidation = false
        setting.depositStripeDisabled = true
        await setting.save()

        const account = shareData.accounts.filter(item => item.symbol.includes('USD'))[0]
        paymentData.accountKey = account.key
        const res = await request(server.app)
            .post(`/payments/deposit`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(paymentData)
        expect(res.status).equal(400)
        expect(res.body.code).equal(DepositErrors.deposit_stripe_disabled.code)
        expect(res.body.message).equal(DepositErrors.deposit_stripe_disabled.message)
    }).timeout(10000)
})
