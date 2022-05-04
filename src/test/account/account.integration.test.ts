import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS} from '../init/db'
import server from '@app/server'
import {IAccount} from "@modules/account/account.interface";
import AccountModel from "@modules/account/account.model";

chai.use(chaiAsPromised)
const {expect, assert} = chai
const userData = {
    firstName: 'John',
    lastName: 'Smith',
    nickName: 'jsmith8',
    email: 'email@gmail.com',
    password: 'Test123!',
    pin: '1111',
    phone: 'phone',
    country: 'country'
}
let shareData = {user: {key: ''}, token: '', refreshToken: '', accounts: []}

describe('Account', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Register', async () => {
        const res = await request(server.app).post('/auth/register').send(userData)
        expect(res.status).equal(200)

        shareData.user = res.body.user
        shareData.token = res.body.token
        shareData.refreshToken = res.body.refreshToken
    }).timeout(10000)

    it('GetAccountsByUser', async () => {
        const res = await request(server.app).get(`/accounts/user/${shareData.user?.key}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        expect(res.body).be.an('array')

        const accounts: IAccount[] = await MODELS.AccountModel.find({userId: shareData.user?.key}).exec()
        shareData.accounts = res.body
        const accountKeyFromResponse = res.body.map((item: { key: any }) => item.key)
        const accountKeyFromDatabase = accounts.map((item: IAccount) => item.key)

        assert.deepEqual(accountKeyFromResponse, accountKeyFromDatabase)
    }).timeout(10000)

    it('GetAccountDetail', async () => {
        const account: IAccount = shareData.accounts[0];
        const res = await request(server.app).get(`/accounts/${account.key}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)

        expect(res.body.key).equal(account.key)
        expect(res.body.userId).equal(account.userId)
        expect(res.body.name).equal(account.name)
        expect(res.body.symbol).equal(account.symbol)
        expect(res.body.platform).equal(account.platform)
        expect(res.body.type).equal(account.type)
        expect(res.body.address).equal(account.address)
    }).timeout(10000)
})
