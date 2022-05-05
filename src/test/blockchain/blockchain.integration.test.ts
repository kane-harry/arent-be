// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest} from '../init/db'
import server from '@app/server'

chai.use(chaiAsPromised)
const {expect, assert} = chai
let shareData = {accounts: [], signature: '', transactions: []}
const symbol = 'LL'
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
        const recipient = shareData.accounts[0]
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

    it('Broadcast Transaction', async () => {
        const sender = shareData.accounts[0]
        const recipient = shareData.accounts[0]
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
        expect(res.status).equal(400)
        expect(res.body.message).equal('Insufficient funds to complete transaction.')
        //TODO switch to 200 code and send successfully
    }).timeout(10000)
})
