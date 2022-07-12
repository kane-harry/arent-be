import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS, validResponse} from '../init/db'
import server from '@app/server'
import {adminData, initDataForUser, makeAdmin} from "@app/test/init/authenticate";

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }
let adminShareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }
const postData = {
    registrationRequireEmailVerified: false,
    registrationRequirePhoneVerified: true,
    loginRequireMFA: false,
    withdrawRequireMFA: false,
    primeTransferFee: 10,
}

const updateData = {
    registrationRequireEmailVerified: true,
    registrationRequirePhoneVerified: false,
    loginRequireMFA: true,
    withdrawRequireMFA: true,
    primeTransferFee: 20,
}
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
        const res = await request(server.app)
            .put('/settings')
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send(postData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const setting = await MODELS.SettingModel.findOne({}, {}, { sort: { created_at: -1 } }).exec()
        expect(setting?.registrationRequireEmailVerified).exist
        expect(setting?.registrationRequirePhoneVerified).exist
        expect(setting?.loginRequireMFA).exist
        expect(setting?.withdrawRequireMFA).exist
        expect(setting?.primeTransferFee).exist

        const settings = await MODELS.SettingModel.find({}, {}, { sort: { created_at: -1 } }).exec()
        expect(settings.length).lessThan(2)
    }).timeout(10000)

    it(`Get setting`, async () => {
        const res = await request(server.app)
            .get('/settings')
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        const setting = await MODELS.SettingModel.findOne({}, {}, { sort: { created_at: -1 } }).exec()
        expect(setting?.registrationRequireEmailVerified).exist
        expect(setting?.registrationRequirePhoneVerified).exist
        expect(setting?.loginRequireMFA).exist
        expect(setting?.withdrawRequireMFA).exist
        expect(setting?.primeTransferFee).exist

        const settings = await MODELS.SettingModel.find({}, {}, { sort: { created_at: -1 } }).exec()
        expect(settings.length).lessThan(2)
    }).timeout(10000)

    it(`Update setting`, async () => {
        const res = await request(server.app)
            .put('/settings')
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send(updateData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const setting = await MODELS.SettingModel.findOne({}, {}, { sort: { created_at: -1 } }).exec()
        expect(setting?.registrationRequireEmailVerified).equal(updateData.registrationRequireEmailVerified)
        expect(setting?.registrationRequirePhoneVerified).equal(updateData.registrationRequirePhoneVerified)
        expect(setting?.loginRequireMFA).equal(updateData.loginRequireMFA)
        expect(setting?.withdrawRequireMFA).equal(updateData.withdrawRequireMFA)
        expect(setting?.primeTransferFee.toString()).equal(updateData.primeTransferFee.toString())

        const settings = await MODELS.SettingModel.find({}, {}, { sort: { created_at: -1 } }).exec()
        expect(settings.length).lessThan(2)
    }).timeout(10000)

    it(`401 Create setting`, async () => {
        const res = await request(server.app)
            .put('/settings')
            .set('Authorization', `Bearer ${shareData.token}`)
            .send({})
        expect(res.status).equal(401)
    }).timeout(10000)

    it(`401 Get setting`, async () => {
        const res = await request(server.app)
            .get('/settings')
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(401)
    }).timeout(10000)

    it(`401 Update setting`, async () => {
        const res = await request(server.app)
            .put('/settings')
            .set('Authorization', `Bearer ${shareData.token}`)
            .send({})
        expect(res.status).equal(401)
    }).timeout(10000)
})
