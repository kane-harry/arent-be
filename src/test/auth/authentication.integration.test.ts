import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { CodeType } from '@modules/verification_code/code.interface'
import { getVerificationCode, initDataForUser, userData } from '@app/test/init/authenticate'
import { config } from '@config'
import SettingService from '@modules/setting/setting.service'
import { formatPhoneNumberWithSymbol, stripPhoneNumber } from '@utils/phone-helper'

chai.use(chaiAsPromised)
const { expect, assert } = chai
const newPassword = 'Test1221!'
const newPin = '2222'
let shareData = { user: {}, token: '', refreshToken: '' }

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
        expect(user?.firstName).equal(userData.firstName)
        expect(user?.lastName).equal(userData.lastName)
        expect(user?.email).equal(userData.email)
        expect(await stripPhoneNumber(user?.phone)).equal(await stripPhoneNumber(userData.phone))
        //Different
        expect(user?.password).not.equal(userData.password)
        expect(user?.pin).not.equal(userData.pin)
    }).timeout(10000)

    it('Login', async () => {
        expect(shareData.token.length).gt(0)
    }).timeout(10000)

    it('RefreshToken', async () => {
        const res = await request(server.app).post('/auth/token/refresh')
            .set('Authorization', `Bearer ${shareData.token}`)
            .send({refreshToken: shareData.refreshToken})
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res?.body?.token).exist
    }).timeout(10000)

    it('Logout', async () => {
        const res = await request(server.app).post('/auth/logout').set('Authorization', `Bearer ${shareData.token}`).send({
            refreshToken: shareData.refreshToken
        })

        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it('ResetPassword', async () => {
        const res1 = await request(server.app).post('/auth/password/reset').set('Authorization', `Bearer ${shareData.token}`).send({
            oldPassword: userData.password,
            newPassword: newPassword,
            newPasswordConfirmation: newPassword
        })

        expect(res1.status).equal(200)
        validResponse(res1.body)
        expect(res1.body.success).equal(true)
    }).timeout(10000)

    it('ResetPin', async () => {
        const res1 = await request(server.app).post('/auth/pin/reset').set('Authorization', `Bearer ${shareData.token}`).send({
            oldPin: userData.pin,
            newPin: newPin,
            newPinConfirmation: newPin
        })

        expect(res1.status).equal(200)
        validResponse(res1.body)
        expect(res1.body.success).equal(true)
    }).timeout(10000)

    it('ForgotPassword', async () => {
        const res = await request(server.app).post('/verification/code/get').send({
            codeType: CodeType.EmailForgotPassword,
            owner: userData.email
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const verificationCode = await MODELS.VerificationCode.findOne(
            {
                type: CodeType.EmailForgotPassword,
                owner: userData.email
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        const res1 = await request(server.app).post('/auth/password/forgot').send({
            code: verificationCode?.code,
            email: userData.email,
            newPassword: newPassword
        })

        expect(res1.status).equal(200)
        expect(res1.body.success).equal(true)
    }).timeout(10000)

    it('ForgotPin', async () => {
        const res = await request(server.app).post('/verification/code/get').send({
            codeType: CodeType.EmailForgotPin,
            owner: userData.email
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const verificationCode = await MODELS.VerificationCode.findOne(
            {
                type: CodeType.EmailForgotPin,
                owner: userData.email
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        const res1 = await request(server.app).post('/auth/pin/forgot').send({
            code: verificationCode?.code,
            email: userData.email,
            newPin: newPin
        })

        expect(res1.status).equal(200)
        validResponse(res1.body)
        expect(res1.body.success).equal(true)
    }).timeout(10000)
})
