import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS, validResponse} from '../init/db'
import server from '@app/server'
import { CodeType } from '@modules/verification_code/code.interface'
import {initDataForUser, userData} from '@app/test/init/authenticate'
import { generateTotpToken } from '@common/twoFactor'
import {TwoFactorType} from "@modules/auth/auth.interface";

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: undefined
    },
    token: '',
    refreshToken: ''
}

describe('Security', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
    }).timeout(10000)

    Object.keys(CodeType).map(key => {
        if (key === CodeType.EmailRegistration) {
            return
        }
        it(`GetVerificationCode ${key}`, async () => {
            const res = await request(server.app).post('/verification/code/get').send({
                codeType: key,
                email: shareData.user.email
            })
            expect(res.status).equal(200)
            validResponse(res.body)
            const verificationCode = await MODELS.VerificationCode.findOne(
                {
                    type: key,
                    owner: shareData.user.email
                },
                {},
                { sort: { created_at: -1 } }
            ).exec()
            expect(verificationCode?.code).exist
        }).timeout(10000)

        it(`VerifyCode ${key}`, async () => {
            const verificationCode = await MODELS.VerificationCode.findOne(
                {
                    type: key,
                    owner: shareData.user.email
                },
                {},
                { sort: { created_at: -1 } }
            ).exec()
            expect(verificationCode?.code).exist

            const res = await request(server.app).post('/verification/code/verify').send({
                codeType: key,
                email: shareData.user.email,
                code: verificationCode?.code
            })
            expect(res.status).equal(200)
            validResponse(res.body)
        }).timeout(10000)
    })

    it(`Generate2FAToken`, async () => {
        const res = await request(server.app).post('/users/2fa/generate').set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
    }).timeout(10000)

    it(`Update2FA`, async () => {
        const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
        if (!user) {
            return expect(500).equal(200)
        }
        const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
        const token = generateTotpToken(twoFactorSecret)
        const res = await request(server.app).post('/users/2fa/update').set('Authorization', `Bearer ${shareData.token}`).send({
            twoFactorEnable: TwoFactorType.TOTP,
            token: token
        })
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`LogInUsingTotp`, async () => {
        const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
        if (!user) {
            return expect(500).equal(200)
        }
        const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
        const token = generateTotpToken(twoFactorSecret)

        const res1 = await request(server.app).post('/auth/login').send({email: userData.email, password: userData.password, token: token})
        validResponse(res1.body)
        expect(res1.status).equal(200)

        shareData.user = res1.body.user
        shareData.token = res1.body.token
        shareData.refreshToken = res1.body.refreshToken
    }).timeout(10000)
})
