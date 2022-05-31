import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import {dbTest, MODELS, validResponse} from '../init/db'
import server from '@app/server'
import {CodeType} from '@modules/verification_code/code.interface'
import {initDataForUser} from '@app/test/init/authenticate'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: '',
        phone: ''
    },
    token: '',
    refreshToken: ''
}

describe('Verification Code', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
    }).timeout(10000)

    Object.keys(CodeType).map(key => {
        if (key === CodeType.EmailRegistration) {
            return
        }
        if (CodeType.SMS || key == CodeType.SMSLogIn) {
            return
        }
        it(`GetVerificationCode ${key}`, async () => {
            const owner = shareData.user.email
            const res = await request(server.app).post('/verification/code/get').send({
                codeType: key,
                owner: owner
            })
            expect(res.status).equal(200)
            validResponse(res.body)
            const verificationCode = await MODELS.VerificationCode.findOne(
                {
                    type: key,
                    owner: owner
                },
                {},
                { sort: { created_at: -1 } }
            ).exec()
            expect(verificationCode?.code).exist
        }).timeout(10000)

        it(`VerifyCode ${key}`, async () => {
            const owner = key == CodeType.SMS || key == CodeType.SMSLogIn ? shareData.user.phone : shareData.user.email
            const verificationCode = await MODELS.VerificationCode.findOne(
                {
                    type: key,
                    owner: owner
                },
                {},
                { sort: { created_at: -1 } }
            ).exec()
            expect(verificationCode?.code).exist

            const res = await request(server.app).post('/verification/code/verify').send({
                codeType: key,
                owner: owner,
                code: verificationCode?.code
            })
            expect(res.status).equal(200)
            validResponse(res.body)
        }).timeout(10000)
    })
})
