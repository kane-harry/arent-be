import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS} from '../init/db'
import server from '@app/server'
import {CodeType} from "@modules/verification_code/code.interface";

chai.use(chaiAsPromised)
const {expect, assert} = chai
const userData = {
    email: 'email@gmail.com',
}

describe('Security', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    Object.keys(CodeType).map(key => {
        it(`GetVerificationCode ${key}`, async () => {
            const res = await request(server.app).post('/verification/code/get').send({
                codeType: key,
                email: userData.email,
            })
            expect(res.status).equal(200)
            const verificationCode = await MODELS.VerificationCode.findOne({type: key, owner: userData.email}, {}, { sort: { 'created_at' : -1 } }).exec()
            expect(verificationCode?.code).exist
        }).timeout(10000)

        it(`VerifyCode ${key}`, async () => {
            const verificationCode = await MODELS.VerificationCode.findOne({type: key, owner: userData.email}, {}, { sort: { 'created_at' : -1 } }).exec()
            expect(verificationCode?.code).exist

            const res = await request(server.app).post('/verification/code/verify').send({
                codeType: key,
                email: userData.email,
                code: verificationCode?.code,
            })
            expect(res.status).equal(200)
        }).timeout(10000)
    })
})
