import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS, validResponse} from '../init/db'
import server from '@app/server'
import { IAccount } from '@modules/account/account.interface'
import { initDataForUser } from '@app/test/init/authenticate'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }
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

    it('GetAccountsByUser', async () => {
        const res = await request(server.app).get(`/accounts/user/${shareData.user?.key}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body).be.an('array')
        const accounts: IAccount[] = await MODELS.AccountModel.find({ userId: shareData.user?.key }).exec()
        shareData.accounts = res.body
        const accountKeyFromResponse = res.body.map((item: { key: any }) => item.key)
        const accountKeyFromDatabase = accounts.map((item: IAccount) => item.key)

        assert.deepEqual(accountKeyFromResponse, accountKeyFromDatabase)
    }).timeout(10000)

    it('GetAccountDetail', async () => {
        const account: IAccount = shareData.accounts[0]
        const res = await request(server.app).get(`/accounts/${account.key}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.key).equal(account.key)
        expect(res.body.userId).equal(account.userId)
        expect(res.body.name).equal(account.name)
        expect(res.body.symbol).equal(account.symbol)
        expect(res.body.platform).equal(account.platform)
        expect(res.body.type).equal(account.type)
        expect(res.body.address).equal(account.address)
    }).timeout(10000)

    it('GetMyAccountsBySymbol', async () => {
        const res = await request(server.app)
            .get(`/accounts/symbol/${symbol}`)
            .set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body).be.an('object')
        expect(res.body.symbol).equal(symbol)
        expect(res.body.userId).equal(shareData.user.key)
    }).timeout(10000)
})
