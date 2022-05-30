// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, validResponse} from '../init/db'
import server from '@app/server'
import {config} from "@config";
import {adminData, initDataForUser, makeAdmin} from "@app/test/init/authenticate";

chai.use(chaiAsPromised)
const {expect, assert} = chai
let shareData = {user: {}, token: '', refreshToken: '', accounts: [], transactions: []}
let shareMasterData = {user: {}, token: '', refreshToken: '', accounts: [], transactions: [], masterAccounts: []}
const symbol = config.system.primeToken
describe('Account Master', () => {
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
        await initDataForUser(shareMasterData, adminData)
        await makeAdmin(adminData)
    }).timeout(10000)

    it('InitMasterAccounts', async () => {
        const res1 = await request(server.app)
            .post(`/master/accounts/`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send()
        expect(res1.status).equal(200)
    }).timeout(10000)

    it('GetMasterAccounts', async () => {
        const res1 = await request(server.app)
            .get(`/master/accounts/`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send()
        expect(res1.status).equal(200)
        validResponse(res1.body)
        shareMasterData.masterAccounts = res1.body.filter(item => item.symbol === symbol)
    }).timeout(10000)

    it('MintMasterAccount', async () => {
        const sender = shareMasterData.masterAccounts[0]
        const res1 = await request(server.app)
            .post(`/master/accounts/${sender.key}/mint`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send({
                amount: 40996.3,
                notes: 'mint master account',
                type: 'mint'
            })
        expect(res1.status).equal(200)
        validResponse(res1.body)
    }).timeout(10000)

    it('401 InitMasterAccounts', async () => {
        const res1 = await request(server.app)
            .post(`/master/accounts/`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res1.status).equal(401)
    }).timeout(10000)

    it('401 GetMasterAccounts', async () => {
        const res1 = await request(server.app)
            .get(`/master/accounts/`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res1.status).equal(401)
    }).timeout(10000)

    it('401 MintMasterAccount', async () => {
        const sender = shareMasterData.masterAccounts[0]
        const res1 = await request(server.app)
            .post(`/master/accounts/${sender.key}/mint`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send({
                amount: 40996.3,
                notes: 'mint master account',
                type: 'mint'
            })
        expect(res1.status).equal(401)
    }).timeout(10000)
})
