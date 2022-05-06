// @ts-nocheck
import server from '@app/server'
import request from 'supertest'
import {MODELS, validResponse} from "@app/test/init/db";
import {CodeType} from "@modules/verification_code/code.interface";
import chai from 'chai'
import {config} from "@config";
const { expect, assert } = chai

export const register = async (shareData: any, data: object = {}) => {
    const formData = {...userData, ...data}

    if (config.system.registrationRequireEmailVerified) {
        await getVerificationCode(formData.email)
        await verifyCode(formData.email)
    }

    const res = await request(server.app).post('/auth/register').send(formData)
    validResponse(res.body)

    shareData.user = res.body.user
    shareData.token = res.body.token
    shareData.refreshToken = res.body.refreshToken

    return res
}

export const userData = {
    firstName: 'John',
    lastName: 'Smith',
    nickName: 'jsmith8',
    email: 'email@gmail.com',
    password: 'Test123!',
    pin: '1111',
    phone: 'phone',
    country: 'country'
}

export const getVerificationCode = async (email: string) => {
    const res = await request(server.app).post('/verification/code/get').send({
        codeType: CodeType.EmailRegistration,
        email: email
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
        email: email,
        code: verificationCode?.code
    })
    expect(res.status).equal(200)
    validResponse(res.body)
}