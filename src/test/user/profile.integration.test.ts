import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import AWS from 'aws-sdk'
import sinon from 'sinon'
import { adminData, initDataForUser, makeAdmin, userData } from '@app/test/init/authenticate'
import { CodeType } from '@modules/verification_code/code.interface'
import { formatPhoneNumberWithSymbol, stripPhoneNumber } from '@common/phone-helper'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: ''
    },
    token: '',
    refreshToken: '',
    newEmailCode: '',
    newPhoneCode: ''
}
let adminShareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [] }

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
        const updateRes = await request(server.app).get(`/users/info/${userData.chatName}`)

        expect(updateRes.status).equal(200)
        validResponse(updateRes.body)

        const user = await MODELS.UserModel.findOne({ chatName: userData.chatName }).exec()
        expect(user?.email).equal(userData.email)
        expect(user?.firstName).equal(userData.firstName)
        expect(user?.lastName).equal(userData.lastName)
        expect(user?.chatName).equal(userData.chatName)
        expect(await stripPhoneNumber(user?.phone)).equal(await stripPhoneNumber(userData.phone))
    })

    context('Test case for function updateUser', () => {
        it('updateUser should be throw without authenticate', async () => {
            const res = await request(server.app).post('/users/info').send(updateData)
            expect(res.status).equal(401)
            validResponse(res.body)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })

        it('updateUser should be success', async () => {
            updateData.newEmailCode = shareData.newEmailCode
            updateData.newPhoneCode = shareData.newPhoneCode
            const updateRes = await request(server.app).post('/users/info').set('Authorization', `Bearer ${shareData.token}`).send(updateData)

            expect(updateRes.status).equal(200)
            validResponse(updateRes.body)

            const user = await MODELS.UserModel.findOne({ email: updateData.email }).exec()
            expect(user?.email).equal(updateData.email)
            expect(user?.firstName).equal(updateData.firstName)
            expect(user?.lastName).equal(updateData.lastName)
            expect(user?.chatName).equal(updateData.chatName)
            expect(await stripPhoneNumber(user?.phone)).equal(await stripPhoneNumber(updateData.phone))
            expect(user?.playerId).equal(updateData.playerId)
        })
    })

    it('GetUserList', async () => {
        const pageIndex = 1
        const pageSize = 25
        const res = await request(server.app)
            .get(`/users/list?pageindex=${pageIndex}&pagesize=${pageSize}`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
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
        expect(user?.chatName).equal(res.body.chatName)
        expect(user?.phone).equal(res.body.phone)
        expect(user?.country).equal(res.body.country)
    }).timeout(10000)
})
