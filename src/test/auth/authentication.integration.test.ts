// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { initDataForUser, userData } from '@app/test/init/authenticate'
import { getPhoneInfo } from '@utils/phoneNumber'
import { CodeType } from '@config/constants'
import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'

chai.use(chaiAsPromised)
const { expect, assert } = chai
const newPassword = 'Test1221!'
const newPin = '2222'
let shareData = { user: { key: '' }, token: '', refreshToken: '' }

describe('Authentication', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Register', async () => {
        const res = await initDataForUser(shareData)
        expect(res.status).equal(200)
        validResponse(res.body)

        const user = await MODELS.UserModel.findOne({ email: userData.email }).exec()

        //Same
        expect(user?.first_name).equal(userData.first_name)
        expect(user?.last_name).equal(userData.last_name)
        expect(user?.email).equal(userData.email)
        const phoneInfo1 = getPhoneInfo(user?.phone)
        if (!phoneInfo1.is_valid) {
            throw new BizException(AuthErrors.invalid_phone, new ErrorContext('test', 'register', { phone: userData.phone }))
        }
        const phoneInfo2 = getPhoneInfo(userData.phone)
        if (!phoneInfo2.is_valid) {
            throw new BizException(AuthErrors.invalid_phone, new ErrorContext('test', 'register', { phone: userData.phone }))
        }
        expect(phoneInfo1.phone).equal(phoneInfo2.phone)
        //Different
        expect(user?.password).not.equal(userData.password)
        expect(user?.pin).not.equal(userData.pin)
    }).timeout(10000)

    it('Login', async () => {
        expect(shareData.token.length).gt(0)
    }).timeout(10000)

    it('Logout', async () => {
        const res = await request(server.app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${shareData.token}`).send({
            refreshToken: shareData.refreshToken
        })

        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it('RefreshToken', async () => {
        const res = await request(server.app).post('/api/v1/auth/token/refresh').set('Authorization', `Bearer ${shareData.refreshToken}`).send({})
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res?.body?.token).exist
    }).timeout(10000)

    it('ForgotPassword', async () => {
        const res1 = await request(server.app).post('/api/v1/users/password/forgot').send({
            owner: userData.email,
            type: 'email'
        })

        expect(res1.status).equal(200)
        expect(res1.body.success).equal(true)
    }).timeout(10000)

    it('ResetPassword', async () => {
        const verificationCode = await MODELS.VerificationCode.findOne(
            {
                type: CodeType.ForgotPassword,
                owner: userData.email
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        const res1 = await request(server.app).post('/api/v1/users/password/reset').set('Authorization', `Bearer ${shareData.token}`).send({
            owner: userData.email,
            type: 'email',
            pin: userData.pin,
            code: verificationCode?.code,
            password: newPassword
        })

        expect(res1.status).equal(200)
        validResponse(res1.body)
        expect(res1.body.success).equal(true)
    }).timeout(10000)

    it('ForgotPin', async () => {
        const res1 = await request(server.app).post('/api/v1/users/pin/forgot').send({
            owner: userData.email,
            type: 'email'
        })

        expect(res1.status).equal(200)
        expect(res1.body.success).equal(true)
    }).timeout(10000)

    it('ResetPin', async () => {
        const verificationCode = await MODELS.VerificationCode.findOne(
            {
                type: CodeType.ForgotPin,
                owner: shareData.user.key
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        const res1 = await request(server.app).post('/api/v1/users/pin/reset').set('Authorization', `Bearer ${shareData.token}`).send({
            owner: userData.email,
            type: 'email',
            password: newPassword,
            code: verificationCode?.code,
            pin: newPin
        })

        expect(res1.status).equal(200)
        validResponse(res1.body)
        expect(res1.body.success).equal(true)
    }).timeout(10000)
})
