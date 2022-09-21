// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { config } from '@config'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'
import { AccountModel } from '@modules/account/account.model'
import { AccountType } from '@config/constants'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { user: {}, token: '', refreshToken: '', accounts: [], transactions: [] }
let shareMasterData = { user: {}, token: '', refreshToken: '', accounts: [], transactions: [], masterAccounts: [] }
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
        const res1 = await request(server.app).post(`/api/v1/accounts/master`).set('Authorization', `Bearer ${shareMasterData.token}`).send()
        expect(res1.status).equal(200)
    }).timeout(10000)

    it('GetMasterAccounts', async () => {
        const accounts = await AccountModel.find({ user_key: AccountType.Master, removed: false })
        expect(accounts.length).gt(0)
        shareMasterData.masterAccounts = accounts
    }).timeout(10000)

    it('MintMasterAccount', async () => {
        const sender = shareMasterData.masterAccounts[0]
        const res1 = await request(server.app)
            .post(`/api/v1/accounts/${sender.key}/mint`)
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
        const res1 = await request(server.app).post(`/api/v1/accounts/master`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res1.status).equal(401)
    }).timeout(10000)

    it('401 MintMasterAccount', async () => {
        const sender = shareMasterData.masterAccounts[0]
        const res1 = await request(server.app).post(`/api/v1/accounts/${sender.key}/mint`).set('Authorization', `Bearer ${shareData.token}`).send({
            amount: 40996.3,
            notes: 'mint master account',
            type: 'mint'
        })
        expect(res1.status).equal(401)
    }).timeout(10000)
})
