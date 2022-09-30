import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser, makeAdmin, userData } from '@app/test/init/authenticate'
import { stripPhoneNumber } from '@utils/phoneNumber'
import { CodeType } from '@config/constants'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: '',
        key: '',
        chat_name: '',
        first_name: '',
        last_name: '',
        phone: ''
    },
    token: '',
    refreshToken: '',
    newEmailCode: '',
    newPhoneCode: ''
}
let adminShareData = { user: { key: '', chat_name: '' }, token: '', refreshToken: '', accounts: [] }

const updateData = {
    email: 'new.email@gmail.com',
    first_name: 'firstName',
    last_name: 'lastName',
    chat_name: 'chatName',
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
            const res = await request(server.app).post('/api/v1/users/avatar').attach('avatar', './src/test/init/test.jpeg')
            expect(res.status).equal(401)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })

        it('uploadAvatar should be success', async () => {
            const res = await request(server.app)
                .post('/api/v1/users/avatar')
                .set('Authorization', `Bearer ${shareData.token}`)
                .attach('avatar', './src/test/init/test.jpeg')

            expect(res.status).equal(200)
            validResponse(res.body)

            const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
            expect(user?.avatar).exist
        }).timeout(20000)

        it('uploadBackground should be success', async () => {
            const res = await request(server.app)
                .post('/api/v1/users/background')
                .set('Authorization', `Bearer ${shareData.token}`)
                .attach('background', './src/test/init/test.jpeg')

            expect(res.status).equal(200)
            validResponse(res.body)
            const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
            expect(user?.background).exist
        }).timeout(20000)
    })

    it(`GetVerificationCode EmailUpdate`, async () => {
        const owner = updateData.email
        const codeType = CodeType.EmailUpdate
        const res = await request(server.app).post('/api/v1/verification/code/generate').send({
            code_type: codeType,
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
        const res = await request(server.app).post('/api/v1/verification/code/generate').send({
            code_type: codeType,
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
        const updateRes = await request(server.app).get(`/api/v1/users/${shareData.user.chat_name}/brief`)

        expect(updateRes.status).equal(200)
        validResponse(updateRes.body)

        expect(updateRes.body?.email).equal(shareData.user.email)
        expect(updateRes.body?.first_name).equal(shareData.user.first_name)
        expect(updateRes.body?.last_name).equal(shareData.user.last_name)
        expect(updateRes.body?.chat_name).equal(shareData.user.chat_name)
    })

    context('Test case for function updateUser', () => {
        it('updateUser should be throw without authenticate', async () => {
            const res = await request(server.app).put('/api/v1/users/profile').send(updateData)
            expect(res.status).equal(401)
            validResponse(res.body)
            expect(res.body).empty
            expect(res.text).equal('Unauthorized')
        })

        it('updateUser should be success', async () => {
            const updateRes = await request(server.app)
                .put(`/api/v1/users/profile`)
                .set('Authorization', `Bearer ${shareData.token}`)
                .send(updateData)

            expect(updateRes.status).equal(200)
            validResponse(updateRes.body)

            const user = await MODELS.UserModel.findOne({ email: userData.email }).exec()
            expect(user?.first_name).equal(updateData.first_name)
            expect(user?.last_name).equal(updateData.last_name)
            expect(user?.chat_name).equal(updateData.chat_name)
        })
    })

    it('GetUserList', async () => {
        const page_index = 1
        const page_size = 25
        const res = await request(server.app)
            .get(`/api/v1/users?page_index=${page_index}&page_size=${page_size}`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.items).be.an('array')
        expect(res.body.total_count).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
    }).timeout(10000)

    it('GetProfile', async () => {
        const res = await request(server.app)
            .get(`/api/v1/users/${shareData.user.key}/profile`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)

        const user = await MODELS.UserModel.findOne({ email: shareData.user.email }).exec()
        expect(user?.first_name).equal(res.body.first_name)
        expect(user?.last_name).equal(res.body.last_name)
        expect(user?.chat_name).equal(res.body.chat_name)
        expect(user?.phone).equal(res.body.phone)
        expect(user?.country).equal(res.body.country)
    }).timeout(10000)

    it('Get Public User', async () => {
        const searchKey = shareData.user.chat_name.substring(0, 5)
        const res = await request(server.app).get(`/api/v1/users/username?search=${searchKey}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)
})
