// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest} from '../init/db'
import server from '@app/server'
import {config} from "@config";
import {register} from "@app/test/init/authenticate";

chai.use(chaiAsPromised)
const {expect, assert} = chai
let shareData = {accounts: [], signature: '', transactions: []}
let shareMasterData = {user: {}, token: '', refreshToken: '', accounts: [], transactions: [], masterAccounts: []}
const symbol = config.system.primeToken
describe('Blockchain', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Create Account (Raw Account)', async () => {
        for (let i = 0; i < 3; i++) {
            const res = await request(server.app).post(`/blockchain/new`)
                .send({
                    symbol: symbol
                })
            expect(res.status).equal(200)
            expect(res.body).be.an('array')
            shareData.accounts.push(res.body[0])
        }
    }).timeout(10000)

    it('Generate signature', async () => {
        const sender = shareData.accounts[0]
        const recipient = shareData.accounts[1]
        const res = await request(server.app).post(`/blockchain/signature`)
            .send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: '1',
                privateKey: sender.privateKey,
                nonce: '1',
                notes: 'test notes',
            })
        expect(res.status).equal(200)
        expect(res.body.signature).be.an('string')
        shareData.signature = res.body.signature
    }).timeout(10000)

    it('Register', async () => {
        await register(shareMasterData)
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
        shareMasterData.masterAccounts = res1.body.filter(item => item.symbol === symbol)
    }).timeout(10000)

    it('MintMasterAccount', async () => {
        const sender = shareMasterData.masterAccounts[0]
        const res1 = await request(server.app)
            .post(`/master/accounts/${sender.key}/mint`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send({
                amount: 100,
                notes: 'mint master account',
                type: 'mint'
            })
        expect(res1.status).equal(200)
    }).timeout(10000)

    it('Send Funds', async () => {
        const sender = shareMasterData.masterAccounts[0]
        const recipient = shareData.accounts[0]
        const res = await request(server.app).post(`/transactions/send`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: '10',
                nonce: '1',
                notes: 'test notes',
            })
        expect(res.status).equal(200)
        expect(res.body.senderTxn).be.an('string')
        expect(res.body.recipientTxn).be.an('string')
    }).timeout(10000)

    it('Broadcast Transaction', async () => {
        const sender = shareData.accounts[0]
        const recipient = shareData.accounts[1]
        const res = await request(server.app).post(`/blockchain/sendraw`)
            .send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: '1',
                nonce: '1',
                notes: 'test notes',
                signature: shareData.signature,
            })
        expect(res.status).equal(200)
        expect(res.body.senderTxn).be.an('string')
        expect(res.body.recipientTxn).be.an('string')
    }).timeout(10000)

    it('Get Transactions by Symbol', async () => {
        const pageIndex = 1
        const pageSize = 25
        const res = await request(server.app).get(`/blockchain/${symbol}/txns?pageindex=${pageIndex}&pagesize=${pageSize}`).send()
        expect(res.status).equal(200)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.hasNextPage).exist
        expect(res.body.totalPages).exist
        expect(res.body.pageIndex).equal(pageIndex)
        expect(res.body.pageSize).equal(pageSize)
        shareData.transactions = res.body.items
    }).timeout(10000)

    it('Get Account Detail', async () => {
        const account = shareData.accounts[0]
        const res = await request(server.app).get(`/blockchain/${symbol}/address/${account.address}`).send()
        expect(res.status).equal(200)
        expect(res.body.address).equal(account.address)
    }).timeout(10000)

    it('Get Transaction Detail', async () => {
        const transaction = shareData.transactions[0]
        const res = await request(server.app).get(`/blockchain/transaction/${transaction.key}`).send()
        expect(res.status).equal(200)
        expect(res.body.key).equal(transaction.key)
    }).timeout(10000)

    it('Get Transactions by Account', async () => {
        const pageIndex = 1
        const pageSize = 25
        const account = shareData.accounts[0]
        const res = await request(server.app).get(`/blockchain/${symbol}/account/${account.address}/txns?pageindex=${pageIndex}&pagesize=${pageSize}`).send()
        expect(res.status).equal(200)
        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.hasNextPage).exist
        expect(res.body.totalPages).exist
        expect(res.body.pageIndex).equal(pageIndex)
        expect(res.body.pageSize).equal(pageSize)
    }).timeout(10000)
})
