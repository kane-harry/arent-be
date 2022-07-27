// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { config } from '@config'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'
import { FeeMode } from '@config/constants'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { accounts: [], signature: '', transactions: [] }
let shareMasterData = { user: {}, token: '', refreshToken: '', accounts: [], transactions: [], masterAccounts: [] }
const symbol = config.system.primeToken
const amount = '4996.3'
describe('Blockchain', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Create Account (Raw Account)', async () => {
        for (let i = 0; i < 3; i++) {
            const res = await request(server.app).post(`/api/v1/blockchain/new`).send({
                symbol: symbol
            })
            expect(res.status).equal(200)
            validResponse(res.body)
            expect(res.body).be.an('array')
            shareData.accounts.push(res.body[0])
        }
    }).timeout(10000)

    it('Generate signature', async () => {
        const sender = shareData.accounts[0]
        const recipient = shareData.accounts[1]
        const res = await request(server.app).post(`/api/v1/blockchain/signature`).send({
            symbol: symbol,
            sender: sender.address,
            recipient: recipient.address,
            amount: amount,
            private_key: sender.privateKey,
            nonce: '1',
            notes: 'test notes'
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.signature).be.an('string')
        shareData.signature = res.body.signature
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
        const res1 = await request(server.app).get(`/api/v1/accounts/`).set('Authorization', `Bearer ${shareMasterData.token}`).send()
        expect(res1.status).equal(200)
        validResponse(res1.body)
        shareMasterData.masterAccounts = res1.body.items.filter(item => item.symbol === symbol && item.user_key === 'MASTER')
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

    it('Send Funds', async () => {
        const amount = '10000'
        const sender = shareMasterData.masterAccounts[0]
        const recipient = shareData.accounts[0]
        const res = await request(server.app).post(`/api/v1/transactions/send`).set('Authorization', `Bearer ${shareMasterData.token}`).send({
            symbol: symbol,
            sender: sender.address,
            recipient: recipient.address,
            amount: amount,
            nonce: '1',
            notes: 'test notes'
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.blockTime).be.an('number')
        expect(res.body.signature).be.an('string')
        expect(res.body.hash).be.an('string')
        expect(res.body.symbol).equal(symbol)
    }).timeout(10000)

    it('Broadcast Transaction', async () => {
        const sender = shareData.accounts[0]
        const recipient = shareData.accounts[1]
        const res = await request(server.app).post(`/api/v1/blockchain/send`).send({
            symbol: symbol,
            sender: sender.address,
            recipient: recipient.address,
            amount: amount,
            nonce: '1',
            notes: 'test notes',
            signature: shareData.signature,
            mode: FeeMode.Exclusive
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.blockTime).be.an('number')
        expect(res.body.signature).be.an('string')
        expect(res.body.hash).be.an('string')
        expect(res.body.symbol).equal(symbol)
        expect(Math.abs(res.body.amount)).equal(Math.abs(amount))
    }).timeout(10000)

    it('Get Transactions by Symbol', async () => {
        const page_index = 1
        const page_size = 25
        const res = await request(server.app).get(`/api/v1/blockchain/${symbol}/txns?page_index=${page_index}&page_size=${page_size}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
        shareData.transactions = res.body.items
    }).timeout(10000)

    it('Get Account Detail', async () => {
        const account = shareData.accounts[0]
        const res = await request(server.app).get(`/api/v1/blockchain/${symbol}/address/${account.address}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.address).equal(account.address)
    }).timeout(10000)

    it('Get Transaction Detail', async () => {
        const transaction = shareData.transactions[0]
        const res = await request(server.app).get(`/api/v1/blockchain/transaction/${transaction.key}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.key).equal(transaction.key)
    }).timeout(10000)

    it('Get Transactions by Account', async () => {
        const page_index = 1
        const page_size = 25
        const account = shareData.accounts[0]
        const res = await request(server.app)
            .get(`/api/v1/blockchain/account/${account.address}/txns?page_index=${page_index}&page_size=${page_size}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
    }).timeout(10000)

    it('Get Prime Account List', async () => {
        const page_index = 1
        const page_size = 20
        const res = await request(server.app)
            .get(`/api/v1/blockchain/${symbol}/accounts/prime/list?page_index=${page_index}&page_size=${page_size}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
    }).timeout(10000)

    it('Get All Prime Account List', async () => {
        const page_index = 1
        const page_size = 20
        const res = await request(server.app).get(`/api/v1/blockchain/accounts/prime/list?page_index=${page_index}&page_size=${page_size}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
    }).timeout(10000)

    it('Get Prime Transaction List', async () => {
        const page_index = 1
        const page_size = 20
        const res = await request(server.app)
            .get(`/api/v1/blockchain/${symbol}/transactions/prime/list?page_index=${page_index}&page_size=${page_size}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
    }).timeout(10000)

    it('Get All Prime Transaction List', async () => {
        const page_index = 1
        const page_size = 20
        const res = await request(server.app).get(`/api/v1/blockchain/transactions/prime/list?page_index=${page_index}&page_size=${page_size}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
    }).timeout(10000)

    it('Get Prime Transaction Stats', async () => {
        const res = await request(server.app).get(`/api/v1/blockchain/${symbol}/transactions/prime/stats`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.stats).be.an('object')
        expect(res.body.stats.totalVolume).be.an('number')
        expect(res.body.stats.totalCount).be.an('number')
        expect(res.body.stats.lastDayVolume).be.an('number')
        expect(res.body.stats.lastDayCount).be.an('number')
        expect(res.body.stats.volumes).be.an('array')
    }).timeout(10000)

    it('Get All Prime Transaction Stats', async () => {
        const res = await request(server.app).get(`/api/v1/blockchain/transactions/prime/stats`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.stats).be.an('object')
        expect(res.body.stats.totalVolume).be.an('number')
        expect(res.body.stats.totalCount).be.an('number')
        expect(res.body.stats.lastDayVolume).be.an('number')
        expect(res.body.stats.lastDayCount).be.an('number')
        expect(res.body.stats.volumes).be.an('array')
    }).timeout(10000)
})
