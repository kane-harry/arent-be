// @ts-nocheck
import server from '@app/server'
import request from 'supertest'
import {MODELS, validResponse} from "@app/test/init/db";
import {CodeType} from "@modules/verification_code/code.interface";
import chai from 'chai'
import {config} from "@config";
import {role} from "@config/role";
const { expect, assert } = chai

export const initDataForUser = async (shareData: any, data: object = {}) => {
    const formData = {...userData, ...data}

    if (config.system.registrationRequireEmailVerified) {
        await getVerificationCode(formData.email)
        await verifyCode(formData.email)
    }

    const res = await request(server.app).post('/auth/register').send(formData)
    validResponse(res.body)
    expect(res.status).equal(200)
    expect(res.body.success).equal(true)

    const res1 = await request(server.app).post('/auth/login').send({email: formData.email, password: formData.password, token: userData.pin})
    validResponse(res1.body)
    expect(res1.status).equal(200)

    shareData.user = res1.body.user
    shareData.token = res1.body.token
    shareData.refreshToken = res1.body.refreshToken

    return res1
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

export const getVerificationCode = async (email: string) => {
    const res = await request(server.app).post('/verification/code/get').send({
        codeType: CodeType.EmailRegistration,
        owner: email
    })
    expect(res.status).equal(200)
    validResponse(res.body)
}

export const verifyCode = async (email: string) => {
    const verificationCode = await MODELS.VerificationCode.findOne(
        {
            type: CodeType.EmailRegistration,
            owner: email
        },
        {},
        { sort: { created_at: -1 } }
    ).exec()
    expect(verificationCode?.code).exist
    const res = await request(server.app).post('/verification/code/verify').send({
        codeType: CodeType.EmailRegistration,
        owner: email,
        code: verificationCode?.code
    })
    expect(res.status).equal(200)
    validResponse(res.body)
}

export const makeAdmin = async (data: object = {}) => {
    const formData = {...userData, ...data}
    const user = await MODELS.UserModel.findOne({ email: formData.email }).exec()
    user?.set('role', role.admin.id, Number)
    user?.save()
}