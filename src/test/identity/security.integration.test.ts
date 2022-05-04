import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS} from '../init/db'
import server from '@app/server'
import {CodeType} from "@modules/verification_code/code.interface";
import {login} from "@app/test/init/authenticate";
import {generateToken} from "@common/twoFactor";

chai.use(chaiAsPromised)
const {expect, assert} = chai
const userData = {
    firstName: 'John',
    lastName: 'Smith',
    nickName: 'jsmith8',
    email: 'email@gmail.com',
    password: 'Test123!',
    pin: '1111',
    phone: 'phone',
    country: 'country'
}
let shareData = {user: {}, token: '', refreshToken: ''}

describe('Security', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Register', async () => {
        const res = await request(server.app).post('/auth/register').send(userData)
        expect(res.status).equal(200)

        shareData.user = res.body.user
        shareData.token = res.body.token
        shareData.refreshToken = res.body.refreshToken
    }).timeout(10000)

    Object.keys(CodeType).map(key => {
        if (key === CodeType.EmailRegistration) {
            return
        }
        it(`GetVerificationCode ${key}`, async () => {
            const res = await request(server.app).post('/verification/code/get').send({
                codeType: key,
                email: userData.email,
            })
            expect(res.status).equal(200)
            const verificationCode = await MODELS.VerificationCode.findOne({type: key, owner: userData.email}, {}, { sort: { 'created_at' : -1 } }).exec()
            expect(verificationCode?.code).exist
        }).timeout(10000)

        it(`VerifyCode ${key}`, async () => {
            const verificationCode = await MODELS.VerificationCode.findOne({type: key, owner: userData.email}, {}, { sort: { 'created_at' : -1 } }).exec()
            expect(verificationCode?.code).exist

            const res = await request(server.app).post('/verification/code/verify').send({
                codeType: key,
                email: userData.email,
                code: verificationCode?.code,
            })
            expect(res.status).equal(200)
        }).timeout(10000)
    })

    it(`Generate2FAToken`, async () => {
        const res = await request(server.app).post('/users/2fa/generate').set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
    }).timeout(10000)

    it(`Update2FA`, async () => {
        const user = await MODELS.UserModel.findOne({ email: userData.email }).exec()
        if (!user) {
            return expect(500).equal(200)
        }
        const token = generateToken(user?.twoFactorSecret)
        const res = await request(server.app).post('/users/2fa/generate').set('Authorization', `Bearer ${shareData.token}`).send({
            twoFactorEnable: 'email',
            token: token,
        })
        expect(res.status).equal(200)
    }).timeout(10000)
})
