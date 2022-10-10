import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { initDataForUser } from '@app/test/init/authenticate'
import { CodeType } from '@config/constants'
import SettingService from '@modules/setting/setting.service'
import UserModel from '@modules/user/user.model'
import SettingModel from '@modules/setting/setting.model'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: '',
        key: '',
        chat_name: '',
        first_name: '',
        last_name: '',
        phone: ''
    },
    token: '',
    refreshToken: '',
    newEmailCode: ''
}

describe('Email Verification', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Init Setting', async () => {
        const setting = await SettingService.getGlobalSetting()
        await SettingModel.updateOne(
            {
                nav_key: setting.nav_key
            },
            {
                $set: {
                    registration_require_email_verified: false
                }
            },
            {
                upsert: true
            }
        ).exec()
    }).timeout(10000)

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
        const user = await UserModel.findOne({ key: shareData.user.key }).exec()
        expect(user?.email_verified).equal(false)
    }).timeout(10000)

    it(`Get Email Verification Code`, async () => {
        const res = await request(server.app).get('/api/v1/users/email/verify').set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        const verificationCode = await MODELS.VerificationCode.findOne(
            {
                type: CodeType.EmailVerification,
                owner: shareData.user.key
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        expect(verificationCode?.code).exist
        // @ts-ignore
        shareData.newEmailCode = verificationCode?.code
    }).timeout(10000)

    it(`Verify Email Code`, async () => {
        const res = await request(server.app)
            .post('/api/v1/users/email/verify')
            .set('Authorization', `Bearer ${shareData.token}`)
            .send({ key: shareData.user.key, code: shareData.newEmailCode })
        expect(res.status).equal(200)
        validResponse(res.body)
        const user = await UserModel.findOne({ key: shareData.user.key }).exec()
        expect(user?.email_verified).equal(true)
    }).timeout(10000)
})
