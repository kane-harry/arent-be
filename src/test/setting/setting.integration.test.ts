import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'
import { SETTINGS_TYPE } from '@config/constants'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }
let adminShareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }
const postData = {
    registration_require_email_verified: false,
    registration_require_phone_verified: true,
    login_require_mfa: false,
    withdraw_require_mfa: false,
    prime_transfer_fee: 0.1,
    nft_commission_fee_rate: 0.05
}

const updateData = {
    registration_require_email_verified: true,
    registration_require_phone_verified: false,
    login_require_mfa: true,
    withdraw_require_mfa: true,
    prime_transfer_fee: 0.05,
    nft_commission_fee_rate: 0.03
}
const key = SETTINGS_TYPE.global_federation_settings
describe('Setting', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
    }).timeout(10000)

    it('InitDataForAdmin', async () => {
        await initDataForUser(adminShareData, adminData)
        await makeAdmin(adminData)
    }).timeout(10000)

    it(`Create setting`, async () => {
        const res = await request(server.app).put(`/api/v1/settings/${key}`).set('Authorization', `Bearer ${adminShareData.token}`).send(postData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const setting = await MODELS.SettingModel.findOne({}, {}, { sort: { created_at: -1 } }).exec()
        expect(setting?.registration_require_email_verified).exist
        expect(setting?.registration_require_phone_verified).exist
        expect(setting?.login_require_mfa).exist
        expect(setting?.withdraw_require_mfa).exist
        expect(setting?.prime_transfer_fee).exist

        const settings = await MODELS.SettingModel.find({}, {}, { sort: { created_at: -1 } }).exec()
        expect(settings.length).lessThan(2)
    }).timeout(10000)

    it(`Get setting`, async () => {
        const res = await request(server.app).get(`/api/v1/settings/${key}`).set('Authorization', `Bearer ${adminShareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        const setting = await MODELS.SettingModel.findOne({}, {}, { sort: { created_at: -1 } }).exec()
        expect(setting?.registration_require_email_verified).exist
        expect(setting?.registration_require_phone_verified).exist
        expect(setting?.login_require_mfa).exist
        expect(setting?.withdraw_require_mfa).exist
        expect(setting?.prime_transfer_fee).exist

        const settings = await MODELS.SettingModel.find({}, {}, { sort: { created_at: -1 } }).exec()
        expect(settings.length).lessThan(2)
    }).timeout(10000)

    it(`Update setting`, async () => {
        const res = await request(server.app).put(`/api/v1/settings/${key}`).set('Authorization', `Bearer ${adminShareData.token}`).send(updateData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const setting = await MODELS.SettingModel.findOne({}, {}, { sort: { created_at: -1 } }).exec()
        expect(setting?.registration_require_email_verified).equal(updateData.registration_require_email_verified)
        expect(setting?.registration_require_phone_verified).equal(updateData.registration_require_phone_verified)
        expect(setting?.login_require_mfa).equal(updateData.login_require_mfa)
        expect(setting?.withdraw_require_mfa).equal(updateData.withdraw_require_mfa)
        expect(setting?.prime_transfer_fee.toString()).equal(updateData.prime_transfer_fee.toString())

        const settings = await MODELS.SettingModel.find({}, {}, { sort: { created_at: -1 } }).exec()
        expect(settings.length).lessThan(2)
    }).timeout(10000)

    it(`401 Create setting`, async () => {
        const res = await request(server.app).put(`/api/v1/settings/${key}`).set('Authorization', `Bearer ${shareData.token}`).send({})
        expect(res.status).equal(401)
    }).timeout(10000)

    it(`401 Get setting`, async () => {
        const res = await request(server.app).get(`/api/v1/settings/${key}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(401)
    }).timeout(10000)

    it(`401 Update setting`, async () => {
        const res = await request(server.app).put(`/api/v1/settings/${key}`).set('Authorization', `Bearer ${shareData.token}`).send({})
        expect(res.status).equal(401)
    }).timeout(10000)
})
