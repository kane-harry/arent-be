import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS, validResponse} from '../init/db'
import server from '@app/server'
import {adminData, initDataForUser, makeAdmin} from '@app/test/init/authenticate'
import {UserStatus} from "@modules/user/user.interface";

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

    it('LockUser', async () => {
        const lockResponse = await request(server.app)
            .post(`/admin/user/lock`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send({
                userKey: shareData.user.key,
                userStatus: UserStatus.Suspend
            })
        expect(lockResponse.status).equal(200)
        expect(lockResponse.body.key).equal(shareData.user.key)
        expect(lockResponse.body.status).equal(UserStatus.Suspend)
    }).timeout(10000)

    it('UnLockUser', async () => {
        const lockResponse = await request(server.app)
            .post(`/admin/user/lock`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send({
                userKey: shareData.user.key,
                userStatus: UserStatus.Normal
            })
        expect(lockResponse.status).equal(200)
        expect(lockResponse.body.key).equal(shareData.user.key)
        expect(lockResponse.body.status).equal(UserStatus.Normal)
    }).timeout(10000)
})
