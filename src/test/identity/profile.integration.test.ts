import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS } from '../init/db'
import server from '@app/server'
import AWS from 'aws-sdk'
import sinon from 'sinon'

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
let shareData = {user: {}, token: '', refreshToken: ''}

describe('Profile', () => {
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

    context('Test case for function uploadAvatar', () => {
        it('uploadAvatar should be throw without authenticate', async () => {
            const res = await request(server.app).post('/users/avatar').attach('avatar', './src/test/init/test.jpeg')
            expect(res.status).equal(401)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })

        it('uploadAvatar should be success', async () => {
            const avatarKey = 'avatar/25162a7e-972c-4338-9bbc-b654f81a70a9.jpeg'
            sinon.stub(AWS, 'S3').callsFake(() => {
                const upload = () => {
                    const promise = async () => {
                        return {
                            Location: 'https://abc.amazonaws.com/upload/avatar/file.jpeg',
                            Key: avatarKey
                        }
                    }
                    return { promise }
                }
                return { upload }
            })
            const res = await request(server.app)
                .post('/users/avatar')
                .set('Authorization', `Bearer ${shareData.token}`)
                .attach('avatar', './src/test/init/test.jpeg')

            expect(res.status).equal(200)
            expect(res.body.original).equal(avatarKey)
            expect(res.body.lg).equal(avatarKey)
            expect(res.body.sm).equal(avatarKey)
            expect(res.body.mini).equal(avatarKey)

            const user = await MODELS.UserModel.findOne({ email: userData.email }).exec()
            assert.deepEqual(user?.avatar, {
                original: avatarKey,
                lg: avatarKey,
                sm: avatarKey,
                mini: avatarKey
            })
        })
    })

    context('Test case for function updateUser', () => {
        it('updateUser should be throw without authenticate', async () => {
            const res = await request(server.app).post('/users/info').send({
                firstName: 'firstName',
                lastName: 'lastName',
                nickName: 'nickName',
                phone: 'phone',
                country: 'country',
                playerId: 'playerId'
            })
            expect(res.status).equal(401)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })

        // TODO: fill some test
        it('updateUser should be throw with invalid firstName', async () => {})
        it('updateUser should be throw with invalid lastName', async () => {})
        it('updateUser should be throw with invalid nickName', async () => {})
        it('updateUser should be throw with invalid phone', async () => {})
        it('updateUser should be throw with invalid country', async () => {})
        it('updateUser should be throw with invalid playerId', async () => {})

        it('updateUser should be success', async () => {
            const res = await request(server.app).post('/users/info').set('Authorization', `Bearer ${shareData.token}`).send({
                firstName: 'firstName',
                lastName: 'lastName',
                nickName: 'nickName',
                phone: 'phone',
                country: 'country',
                playerId: 'playerId'
            })

            expect(res.status).equal(200)

            const user = await MODELS.UserModel.findOne({ email: userData.email }).exec()
            expect(user?.firstName).equal('firstName')
            expect(user?.lastName).equal('lastName')
            expect(user?.nickName).equal('nickName')
            expect(user?.phone).equal('phone')
            expect(user?.country).equal('country')
            expect(user?.playerId).equal('playerId')
        })
    })
})
