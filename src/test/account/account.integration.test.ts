import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { IAccount } from '@modules/account/account.interface'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }
let shareMasterData = { user: {}, token: '', refreshToken: '', accounts: [], transactions: [], masterAccounts: [] }

const symbol = 'LL'
describe('Account', () => {
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

    it('QueryAccounts', async () => {
        const page_index = 1
        const page_size = 25
        const res = await request(server.app)
            .get(`/api/v1/accounts?page_index=${page_index}&page_size=${page_size}`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.items).be.an('array')
        expect(res.body.total_count).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
        shareData.accounts = res.body.items
    }).timeout(10000)

    it('GetAccountDetail', async () => {
        const account: IAccount = shareData.accounts[0]
        const res = await request(server.app).get(`/api/v1/accounts/${account.key}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.key).equal(account.key)
        expect(res.body.user_key).equal(account.user_key)
        expect(res.body.name).equal(account.name)
        expect(res.body.symbol).equal(account.symbol)
        expect(res.body.platform).equal(account.platform)
        expect(res.body.type).equal(account.type)
        expect(res.body.address).equal(account.address)
    }).timeout(10000)

    // it('Export Transactions by Account', async () => {
    //     const account = shareData.accounts[0]
    //     // @ts-ignore
    //     const res = await request(server.app)
    //         .get(`/accounts/${account.key}/trx/export`)
    //         .set('Authorization', `Bearer ${shareMasterData.token}`)
    //         .send()
    //     expect(res.status).equal(200)
    //     expect(res.type).equal('text/csv')
    //     expect(res.charset).equal('utf-8')
    //     expect(res.text.length).gt(0)
    // }).timeout(10000)

    it('GetAccountsByUser', async () => {
        const res = await request(server.app).get(`/api/v1/accounts/users/me`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.items).be.an('array')
        const accounts: IAccount[] = await MODELS.AccountModel.find({ user_key: shareData.user?.key }).exec()
        shareData.accounts = res.body.items
        const accountKeyFromResponse = res.body.items.map((item: { key: any }) => item.key)
        const accountKeyFromDatabase = accounts.map((item: IAccount) => item.key)

        assert.deepEqual(accountKeyFromResponse.sort(), accountKeyFromDatabase.sort())
    }).timeout(10000)
})
