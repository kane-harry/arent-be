import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { UserAuthCodeType } from '@config/constants'
import UserAuthCode from '@modules/user_auth_code/user_auth_code.model'

chai.use(chaiAsPromised)
const { expect, assert } = chai
const emailData = { owner: 'kane.harry.vn@gmail.com', code: '', type: UserAuthCodeType.Email }
const phoneData = { owner: '84988085977', code: '', type: UserAuthCodeType.Phone }

describe('User Auth Code', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it(`1st Login Email: Get code`, async () => {
        const res = await request(server.app).post('/api/v1/users/code').send({
            type: emailData.type,
            owner: emailData.owner
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const userAuthCode = await UserAuthCode.findOne(
            {
                type: emailData.type,
                owner: emailData.owner
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        expect(userAuthCode?.code).exist
        // @ts-ignore
        emailData.code = userAuthCode?.code
    }).timeout(10000)

    it(`1st Login Email: Real Login`, async () => {
        const res = await request(server.app).post('/api/v1/users/auth').send({
            type: emailData.type,
            owner: emailData.owner,
            code: emailData.code
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.user).exist
        expect(res.body.token).exist
        expect(res.body.refreshToken).exist
        expect(res.body.user.email).equal(emailData.owner)
    }).timeout(10000)

    it(`1st Login Phone: Get code`, async () => {
        const res = await request(server.app).post('/api/v1/users/code').send({
            type: phoneData.type,
            owner: phoneData.owner
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const userAuthCode = await UserAuthCode.findOne(
            {
                type: phoneData.type,
                owner: phoneData.owner
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        expect(userAuthCode?.code).exist
        // @ts-ignore
        phoneData.code = userAuthCode?.code
    }).timeout(10000)

    it(`1st Login Phone: Real Login`, async () => {
        const res = await request(server.app).post('/api/v1/users/auth').send({
            type: phoneData.type,
            owner: phoneData.owner,
            code: phoneData.code
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.user).exist
        expect(res.body.token).exist
        expect(res.body.refreshToken).exist
        expect(res.body.user.phone).equal(phoneData.owner)
    }).timeout(10000)

    it(`2nd Login Email: Get code`, async () => {
        const res = await request(server.app).post('/api/v1/users/code').send({
            type: emailData.type,
            owner: emailData.owner
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const userAuthCode = await UserAuthCode.findOne(
            {
                type: emailData.type,
                owner: emailData.owner
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        expect(userAuthCode?.code).exist
        // @ts-ignore
        emailData.code = userAuthCode?.code
    }).timeout(10000)

    it(`2nd Login Email: Real Login`, async () => {
        const res = await request(server.app).post('/api/v1/users/auth').send({
            type: emailData.type,
            owner: emailData.owner,
            code: emailData.code
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.user).exist
        expect(res.body.token).exist
        expect(res.body.refreshToken).exist
        expect(res.body.user.email).equal(emailData.owner)
    }).timeout(10000)

    it(`2nd Login Phone: Get code`, async () => {
        const res = await request(server.app).post('/api/v1/users/code').send({
            type: phoneData.type,
            owner: phoneData.owner
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        const userAuthCode = await UserAuthCode.findOne(
            {
                type: phoneData.type,
                owner: phoneData.owner
            },
            {},
            { sort: { created_at: -1 } }
        ).exec()
        expect(userAuthCode?.code).exist
        // @ts-ignore
        phoneData.code = userAuthCode?.code
    }).timeout(10000)

    it(`2nd Login Phone: Real Login`, async () => {
        const res = await request(server.app).post('/api/v1/users/auth').send({
            type: phoneData.type,
            owner: phoneData.owner,
            code: phoneData.code
        })
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.user).exist
        expect(res.body.token).exist
        expect(res.body.refreshToken).exist
        expect(res.body.user.phone).equal(phoneData.owner)
    }).timeout(10000)
})
