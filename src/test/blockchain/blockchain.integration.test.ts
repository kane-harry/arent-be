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
})
