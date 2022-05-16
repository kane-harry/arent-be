// @ts-nocheck
import server from '@app/server'
import request from 'supertest'
import { MODELS, validResponse } from '@app/test/init/db'
import { CodeType } from '@modules/verification_code/code.interface'
import chai from 'chai'
import { config } from '@config'
import { role } from '@config/role'
const { expect } = chai

export const initDataForUser = async (shareData: any, data: object = {}) => {
    const formData = { ...userData, ...data }

    if (config.system.registrationRequireEmailVerified) {
        const code = await getVerificationCode(formData.email, CodeType.EmailRegistration)
        await verifyCode(formData.email, CodeType.EmailRegistration, code)
    }

    const registerRes = await request(server.app).post('/auth/register').send(formData)
    validResponse(registerRes.body)
    expect(registerRes.status).equal(200)
    expect(registerRes.body.success).equal(true)

    const loginCode = await getVerificationCode(formData.email, CodeType.EmailLogIn)
    const loginRes = await request(server.app).post('/auth/login').send({ email: formData.email, password: formData.password, token: loginCode })
    validResponse(loginRes.body)
    expect(loginRes.status).equal(200)

    shareData.user = loginRes.body.user
    shareData.token = loginRes.body.token
    shareData.refreshToken = loginRes.body.refreshToken

    return loginRes
}

export const userData = {
    firstName: 'John',
    lastName: 'Smith',
    nickName: 'jsmith8',
    email: 'email@gmail.com',
    password: 'Test123!',
    pin: '1111',
    phone: '+84988085977',
    country: 'country'
}

export const user1Data = {
    firstName: 'John',
    lastName: 'Smith',
    nickName: 'jsmith9',
    email: 'email1@gmail.com',
    password: 'Test123!',
    pin: '2222',
    phone: '1234',
    country: 'country'
}

export const adminData = {
    firstName: 'John',
    lastName: 'Smith',
    nickName: 'admin',
    email: 'admin1@gmail.com',
    password: 'Test123!',
    pin: '3333',
    phone: '5678',
    country: 'country'
}

export const getVerificationCode = async (email: string, codeType:string) => {
    const res = await request(server.app).post('/verification/code/get').send({
        codeType: codeType,
        owner: email
    })
    expect(res.status).equal(200)
    validResponse(res.body)

    const verificationCode = await MODELS.VerificationCode.findOne(
        {
            type: codeType,
            owner: email
        },
        {},
        { sort: { created_at: -1 } }
    ).exec()
    expect(verificationCode?.code).exist

    return verificationCode?.code
}

export const verifyCode = async (email: string, codeType:string, code: string) => {
    const res = await request(server.app).post('/verification/code/verify').send({
        codeType: codeType,
        owner: email,
        code: code
    })
    expect(res.status).equal(200)
    validResponse(res.body)
}

export const makeAdmin = async (data: object = {}) => {
    const formData = { ...userData, ...data }
    const user = await MODELS.UserModel.findOne({ email: formData.email }).exec()
    user?.set('role', role.admin.id, Number)
    user?.save()
}
