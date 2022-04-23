import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS } from '../init/db'
import usersData from './users.data'
import server from '@app/server'

chai.use(chaiAsPromised)
const { expect } = chai

describe('Integration test for module User', () => {
    before(async () => {
        await dbTest.connect()
        await dbTest.mongoUnit.load({
            users: usersData
        })
    })

    after(async () => {
        await dbTest.disconnect()
    })

    context('Test case for function uploadAvatar', () => {
        it('uploadAvatar should be throw without authenticate', async () => {
            const res = await request(server.app).post('/users/avatar').attach('avatar', './src/test/files/test.jpeg')
            console.log(res.text)
            expect(res.status).equal(401)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })
    })
})
