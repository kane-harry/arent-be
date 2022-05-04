import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS} from '../init/db'
import server from '@app/server'

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
let shareData = {user: {}, token: '', refreshToken: ''}

describe('Authentication', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('Register', async () => {
        const res = await request(server.app).post('/auth/register').send(userData)
        expect(res.status).equal(200)

        const user = await MODELS.UserModel.findOne({email: userData.email}).exec()

        //Same
        expect(user?.firstName).equal(userData.firstName)
        expect(user?.lastName).equal(userData.lastName)
        expect(user?.nickName).equal(userData.nickName)
        expect(user?.email).equal(userData.email)
        expect(user?.phone).equal(userData.phone)
        expect(user?.country).equal(userData.country)
        //Different
        expect(user?.password).not.equal(userData.password)
        expect(user?.pin).not.equal(userData.pin)
    }).timeout(10000)

    it('Login', async () => {
        const res = await request(server.app).post('/auth/login').send({
            email: userData.email,
            password: userData.password
        })

        expect(res.status).equal(200)
        expect(res?.body?.user?.email).equal(userData.email)
        expect(res?.body?.token).is.a('string')
        expect(res?.body?.refreshToken).is.a('string')

        shareData.user = res.body.user
        shareData.token = res.body.token
        shareData.refreshToken = res.body.refreshToken
    }).timeout(10000)

    it('Logout', async () => {
        const res = await request(server.app).post('/auth/logout').set('Authorization', `Bearer ${shareData.token}`).send({
            refreshToken: shareData.refreshToken
        })

        expect(res.status).equal(200)
    }).timeout(10000)
})
