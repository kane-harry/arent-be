// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS} from '../init/db'
import server from '@app/server'
import {register} from "@app/test/init/authenticate";

chai.use(chaiAsPromised)
const {expect, assert} = chai
const symbol = 'LL'
let shareData1 = {user: {}, token: '', refreshToken: '', accounts: [], transactions: []}
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

    it('Send Funds', async () => {
        const sender = shareData1.accounts[0]
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
        expect(res.status).equal(400)
        expect(res.body.message).equal('Insufficient funds to complete transaction.')
        //TODO switch to 200 code and send successfully
    }).timeout(10000)

    it('Get Transactions by Account', async () => {
        const pageIndex = 1
        const pageSize = 25
        const account = shareData1.accounts[0]
        const res = await request(server.app).get(`/transactions/accounts/${account.key}?pageindex=${pageIndex}&pagesize=${pageSize}`).send()
        expect(res.status).equal(200)
        expect(res.body.account).be.an('object')
        expect(res.body.txns.items).be.an('array')
        expect(res.body.txns.totalCount).exist
        expect(res.body.txns.hasNextPage).exist
        expect(res.body.txns.totalPages).exist
        expect(res.body.txns.pageIndex).equal(pageIndex)
        expect(res.body.txns.pageSize).equal(pageSize)
    }).timeout(10000)
})
