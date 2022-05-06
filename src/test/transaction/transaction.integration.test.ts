// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS} from '../init/db'
import server from '@app/server'
import {register} from "@app/test/init/authenticate";
import {config} from "@config";

chai.use(chaiAsPromised)
const {expect, assert} = chai
const symbol = config.system.primeToken
let shareData1 = {user: {}, token: '', refreshToken: '', accounts: [], transactions: [], masterAccounts: []}
let shareData2 = {user: {}, token: '', refreshToken: '', accounts: [], transactions: []}
describe('Transaction', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Register', async () => {
        await register(shareData1, {email: 'user1@gmail.com'})
        await register(shareData2, {email: 'user2@gmail.com'})
    }).timeout(10000)

    it('GetAccountsByUser', async () => {
        const res1 = await request(server.app).get(`/accounts/user/${shareData1.user?.key}`).set('Authorization', `Bearer ${shareData1.token}`).send()
        expect(res1.status).equal(200)
        expect(res1.body).be.an('array')
        shareData1.accounts = res1.body

        const res2 = await request(server.app).get(`/accounts/user/${shareData2.user?.key}`).set('Authorization', `Bearer ${shareData2.token}`).send()
        expect(res2.status).equal(200)
        expect(res2.body).be.an('array')
        shareData2.accounts = res2.body
    }).timeout(10000)

    it('InitMasterAccounts', async () => {
        const res1 = await request(server.app)
            .post(`/master/accounts/`)
            .set('Authorization', `Bearer ${shareData1.token}`)
            .send()
        expect(res1.status).equal(200)
    }).timeout(10000)

    it('GetMasterAccounts', async () => {
        const res1 = await request(server.app)
            .get(`/master/accounts/`)
            .set('Authorization', `Bearer ${shareData1.token}`)
            .send()
        expect(res1.status).equal(200)
        shareData1.masterAccounts = res1.body.filter(item => item.symbol === symbol)
    }).timeout(10000)

    it('MintMasterAccount', async () => {
        const sender = shareData1.masterAccounts[0]
        const res1 = await request(server.app)
            .post(`/master/accounts/${sender.key}/mint`)
            .set('Authorization', `Bearer ${shareData1.token}`)
            .send({
                amount: 100,
                notes: 'mint master account',
                type: 'mint'
            })
        expect(res1.status).equal(200)
    }).timeout(10000)

    it('Send Funds', async () => {
        const sender = shareData1.masterAccounts[0]
        const recipient = shareData2.accounts[0]
        const res = await request(server.app).post(`/transactions/send`)
            .set('Authorization', `Bearer ${shareData1.token}`)
            .send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: '1',
                nonce: '1',
                notes: 'test notes',
            })
        expect(res.status).equal(200)
        expect(res.body.senderTxn).be.an('string')
        expect(res.body.recipientTxn).be.an('string')
    }).timeout(10000)

    it('Get Transactions by Account', async () => {
        const pageIndex = 1
        const pageSize = 25
        const account = shareData1.masterAccounts[0]
        const res = await request(server.app).get(`/transactions/accounts/${account.key}?pageindex=${pageIndex}&pagesize=${pageSize}`).send()
        expect(res.status).equal(200)
        expect(res.body.account).be.an('object')
        expect(res.body.txns.items).be.an('array')
        expect(res.body.txns.totalCount).exist
        expect(res.body.txns.hasNextPage).exist
        expect(res.body.txns.totalPages).exist
        expect(res.body.txns.pageIndex).equal(pageIndex)
        expect(res.body.txns.pageSize).equal(pageSize)
        shareData1.transactions = res.body.txns.items
    }).timeout(10000)

    it('Get Transaction Detail', async () => {
        const account = shareData1.masterAccounts[0]
        const transaction = shareData1.transactions[0]
        const res = await request(server.app).get(`/transactions/accounts/${account.key}/txn/${transaction.key}`).send()
        expect(res.status).equal(200)
        expect(res.body.key).equal(transaction.key)
        expect(res.body.symbol).equal(symbol)
        expect(res.body.sender).equal(account.address)
        expect(res.body.type).equal(transaction.type)
    }).timeout(10000)
})
