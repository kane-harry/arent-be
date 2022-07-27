import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import AWS from 'aws-sdk'
import sinon from 'sinon'
import { adminData, initDataForUser, makeAdmin, userData } from '@app/test/init/authenticate'
import { stripPhoneNumber } from '@utils/phoneNumber'
import { CodeType } from '@config/constants'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: '',
        key: '',
        chatName: '',
        firstName: '',
        lastName: '',
        phone: ''
    },
    token: '',
    refreshToken: '',
    newEmailCode: '',
    newPhoneCode: ''
}
let adminShareData = { user: { key: '', chatName: '' }, token: '', refreshToken: '', accounts: [] }

const updateData = {
    email: 'new.email@gmail.com',
    firstName: 'firstName',
    lastName: 'lastName',
    chatName: 'chatName',
    phone: '+972552992022',
    country: 'country',
    playerId: 'playerId',
    newEmailCode: '',
    newPhoneCode: ''
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

    it('InitDataForAdmin', async () => {
        await initDataForUser(adminShareData, adminData)
        await makeAdmin(adminData)
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

    it(`GetVerificationCode EmailUpdate`, async () => {
        const owner = updateData.email
        const codeType = CodeType.EmailUpdate
        const res = await request(server.app).post('/verification/code/get').send({
            codeType: codeType,
            owner: owner
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const verificationCode = await MODELS.VerificationCode.findOne(
            {
                type: codeType,
                owner: owner
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        expect(verificationCode?.code).exist
        // @ts-ignore
        shareData.newEmailCode = verificationCode?.code
    }).timeout(10000)

    it(`GetVerificationCode PhoneUpdate`, async () => {
        const owner = await stripPhoneNumber(updateData.phone)
        const codeType = CodeType.PhoneUpdate
        const res = await request(server.app).post('/verification/code/get').send({
            codeType: codeType,
            owner: owner
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const verificationCode = await MODELS.VerificationCode.findOne(
            {
                type: codeType,
                owner: owner
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        expect(verificationCode?.code).exist
        // @ts-ignore
        shareData.newPhoneCode = verificationCode?.code
    }).timeout(10000)

    it('GetPublicUserByChatName', async () => {
        const updateRes = await request(server.app).get(`/users/${shareData.user.chatName}/brief`)

        expect(updateRes.status).equal(200)
        validResponse(updateRes.body)

        expect(updateRes.body?.email).equal(shareData.user.email)
        expect(updateRes.body?.firstName).equal(shareData.user.firstName)
        expect(updateRes.body?.lastName).equal(shareData.user.lastName)
        expect(updateRes.body?.chatName).equal(shareData.user.chatName)
    })

    context('Test case for function updateUser', () => {
        it('updateUser should be throw without authenticate', async () => {
            const res = await request(server.app).put('/users/profile').send(updateData)
            expect(res.status).equal(401)
            validResponse(res.body)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })

        it('updateUser should be success', async () => {
            const updateRes = await request(server.app).put(`/users/profile`).set('Authorization', `Bearer ${shareData.token}`).send(updateData)

            expect(updateRes.status).equal(200)
            validResponse(updateRes.body)

            const user = await MODELS.UserModel.findOne({ email: userData.email }).exec()
            expect(user?.first_name).equal(updateData.firstName)
            expect(user?.last_name).equal(updateData.lastName)
            expect(user?.chat_name).equal(updateData.chatName)
        })
    })

    it('GetUserList', async () => {
        const page_index = 1
        const page_size = 25
        const res = await request(server.app)
            .get(`/users?page_index=${page_index}&page_size=${page_size}`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.items).be.an('array')
        expect(res.body.totalCount).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
    }).timeout(10000)

    it('GetProfile', async () => {
        const res = await request(server.app).get(`/users/${shareData.user.key}/profile`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
        expect(user?.first_name).equal(res.body.firstName)
        expect(user?.last_name).equal(res.body.lastName)
        expect(user?.chat_name).equal(res.body.chatName)
        expect(user?.phone).equal(res.body.phone)
        expect(user?.country).equal(res.body.country)
    }).timeout(10000)
})
