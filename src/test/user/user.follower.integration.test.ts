import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser } from '@app/test/init/authenticate'
import UserFollowerModel from '@modules/user_follower/user.follower.model'
import UserModel from '@modules/user/user.model'

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
    newEmailCode: '',
    newPhoneCode: ''
}
let adminShareData = { user: { key: '', chat_name: '' }, token: '', refreshToken: '', accounts: [] }

describe('User Follower', () => {
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
    }).timeout(10000)

    it(`Follow user`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/users/${shareData.user.key}/follow`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        const userFollower = await UserFollowerModel.findOne({
            user_key: shareData.user.key,
            follower_key: adminShareData.user.key
        })
        expect(userFollower?.follower_key).equal(adminShareData.user.key)

        const user = await UserModel.findOne({ key: shareData.user.key })
        expect(user?.number_of_followers).gt(0)
    }).timeout(10000)

    it(`Get followers`, async () => {
        const res = await request(server.app).get(`/api/v1/users/${shareData.user.key}/followers`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).gt(0)
    }).timeout(10000)

    it(`Get following`, async () => {
        const res = await request(server.app).get(`/api/v1/users/${adminShareData.user.key}/following`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).gt(0)
    }).timeout(10000)

    it(`Get My Follower`, async () => {
        const res = await request(server.app)
            .get(`/api/v1/users/${shareData.user.key}/follow`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.followed).equal(true)
    }).timeout(10000)

    it(`UnFollow user`, async () => {
        const res = await request(server.app)
            .delete(`/api/v1/users/${shareData.user.key}/follow`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        const userFollower = await UserFollowerModel.findOne({
            user_key: shareData.user.key,
            follower_key: shareData.user.key
        })
        expect(userFollower).not.exist

        const user = await UserModel.findOne({ key: shareData.user.key })
        expect(user?.number_of_followers).equal(0)
    }).timeout(10000)

    it(`Get followers`, async () => {
        const res = await request(server.app).get(`/api/v1/users/${shareData.user.key}/followers`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).equal(0)
    }).timeout(10000)

    it(`Get following`, async () => {
        const res = await request(server.app).get(`/api/v1/users/${adminShareData.user.key}/following`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).equal(0)
    }).timeout(10000)

    it(`Get My Follower`, async () => {
        const res = await request(server.app)
            .get(`/api/v1/users/${shareData.user.key}/follow`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.followed).equal(false)
    }).timeout(10000)
})
