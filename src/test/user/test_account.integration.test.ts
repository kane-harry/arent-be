import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { CodeType } from '@modules/verification_code/code.interface'
import { initDataForUser, userData } from '@app/test/init/authenticate'
import { MFAType } from '@modules/auth/auth.interface'
import { generateToken } from '@utils/totp'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: undefined,
        phone: undefined,
        key: undefined
    },
    token: '',
    refreshToken: ''
}

export const testData = {
    email: 'gjgtest@pellartech.com'
}

describe('Test Account *test@pellartech.com', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData, testData)
    }).timeout(10000)

    it(`GenerateTotpToken`, async () => {
        const res = await request(server.app).post('/users/totp/generate').set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
    }).timeout(10000)

    it(`UpdateMFATotp`, async () => {
        const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
        if (!user) {
            return expect(500).equal(200)
        }
        const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
        const token = generateToken(twoFactorSecret)
        expect(token).equal('123654')
        const res = await request(server.app).post(`/users/${shareData.user.key}/mfa`).set('Authorization', `Bearer ${shareData.token}`).send({
            MFAType: MFAType.TOTP,
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
        const token = generateToken(twoFactorSecret)
        expect(token).equal('123654')

        const res1 = await request(server.app).post('/auth/login').send({ email: testData.email, password: userData.password, token: token })
        validResponse(res1.body)
        expect(res1.status).equal(200)

        shareData.user = res1.body.user
        shareData.token = res1.body.token
        shareData.refreshToken = res1.body.refreshToken
    }).timeout(10000)
})
