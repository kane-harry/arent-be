import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS } from '../init/db'
import server from '@app/server'

chai.use(chaiAsPromised)
const { expect, assert } = chai
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

describe('Integration test for module Authentication', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    context('Authentication', function () {
        it('Register', async () => {
            const res = await request(server.app).post('/auth/register').send(userData)
            expect(res.status).equal(200)

            const user = await MODELS.UserModel.findOne({ email: userData.email }).exec()

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
        }).timeout(10000)
    })
})
