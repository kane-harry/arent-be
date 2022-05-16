import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS, validResponse} from '../init/db'
import server from '@app/server'
import AWS from 'aws-sdk'
import sinon from 'sinon'
import { initDataForUser } from '@app/test/init/authenticate'
import {IAccount} from "@modules/account/account.interface";

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: ''
    },
    token: '',
    refreshToken: ''
}

describe('Profile', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
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
            validResponse(res.body)
            expect(res.body.original).equal(avatarKey)
            expect(res.body.lg).equal(avatarKey)
            expect(res.body.sm).equal(avatarKey)
            expect(res.body.mini).equal(avatarKey)

            const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
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
            validResponse(res.body)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })

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
            validResponse(res.body)

            const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
            expect(user?.firstName).equal('firstName')
            expect(user?.lastName).equal('lastName')
            expect(user?.nickName).equal('nickName')
            expect(user?.phone).equal('phone')
            expect(user?.country).equal('country')
            expect(user?.playerId).equal('playerId')
        })
    })

    it('GetUserList', async () => {
        const pageIndex = 1
        const pageSize = 25
        const res = await request(server.app).get(`/users/list?pageindex=${pageIndex}&pagesize=${pageSize}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.hasNextPage).exist
        expect(res.body.totalPages).exist
        expect(res.body.pageIndex).equal(pageIndex)
        expect(res.body.pageSize).equal(pageSize)
    }).timeout(10000)

    it('GetProfile', async () => {
        const res = await request(server.app).get(`/users/me`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
        expect(user?.firstName).equal(res.body.firstName)
        expect(user?.lastName).equal(res.body.lastName)
        expect(user?.nickName).equal(res.body.nickName)
        expect(user?.phone).equal(res.body.phone)
        expect(user?.country).equal(res.body.country)
    }).timeout(10000)
})
