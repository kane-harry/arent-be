import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser, makeAdmin, userData } from '@app/test/init/authenticate'
import UserModel from '@modules/user/user.model'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }
let adminShareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }

describe('Admin', () => {
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

    it('401 Reset TOTP', async () => {
        const response = await request(server.app)
            .post(`/users/${shareData.user.key}/totp/reset`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(response.status).equal(401)
    }).timeout(10000)

    it('Reset TOTP', async () => {
        const response = await request(server.app)
            .post(`/users/${shareData.user.key}/totp/reset`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(response.status).equal(200)

        const user = await UserModel.findOne({ key: shareData.user.key }).exec()
        let twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
        expect(twoFactorSecret).equal('undefined')
    }).timeout(10000)

    it('401 RemoveUser', async () => {
        const response = await request(server.app)
            .post(`/users/${shareData.user.key}/remove`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(response.status).equal(401)
    }).timeout(10000)

    it('RemoveUser', async () => {
        const response = await request(server.app)
            .post(`/users/${shareData.user.key}/remove`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(response.status).equal(200)
        expect(response.body.key).equal(shareData.user.key)

        const user = await UserModel.findOne({ key: shareData.user.key }).exec()
        let removed = String(user?.get('removed', null, { getters: false }))
        expect(removed).equal('true')
    }).timeout(10000)

    it('Disable Login After Removed User', async () => {
        const response = await request(server.app).post('/auth/login').send({ email: userData.email, password: userData.password, token: '123456' })
        validResponse(response.body)
        expect(response.status).equal(400)
    }).timeout(10000)
})
