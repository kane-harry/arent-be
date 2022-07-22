// @ts-nocheck
import server from '@app/server'
import request from 'supertest'
import { MODELS, validResponse } from '@app/test/init/db'
import chai from 'chai'
import { role } from '@config/role'
import SettingService from '@modules/setting/setting.service'
import { CODE_TYPE } from '@config/constants'
const { expect } = chai

export const initDataForUser = async (shareData: any, data: object = {}) => {
    const formData = { ...userData, ...data }
    const setting: any = await SettingService.getGlobalSetting()
    if (setting.registrationRequireEmailVerified) {
        const code = await getVerificationCode(formData.email, CODE_TYPE.EmailRegistration)
        await verifyCode(formData.email, CODE_TYPE.EmailRegistration, code)
    }

    if (setting.registrationRequirePhoneVerified) {
        const code = await getVerificationCode(formData.phone, CODE_TYPE.PhoneRegistration)
        await verifyCode(formData.phone, CODE_TYPE.PhoneRegistration, code)
    }

    const registerRes = await request(server.app).post('/auth/register').send(formData)
    validResponse(registerRes.body)
    expect(registerRes.status).equal(200)

    let loginRes = await request(server.app).post('/auth/login').send({ email: formData.email, password: formData.password })
    if (!loginRes.body.token) {
        const loginCode = await getLoginCode(formData)
        loginRes = await request(server.app).post('/auth/login').send({ email: formData.email, password: formData.password, token: loginCode })
    }
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
    chatName: 'jsmith8',
    email: 'email@gmail.com',
    password: 'Test123!',
    pin: '1111',
    phone: '+84988085977',
    country: 'country'
}

export const user1Data = {
    firstName: 'John',
    lastName: 'Smith',
    chatName: 'jsmith9',
    email: 'email1@gmail.com',
    password: 'Test123!',
    pin: '2222',
    phone: '+79366199804',
    country: 'country'
}

export const adminData = {
    firstName: 'John',
    lastName: 'Smith',
    chatName: 'admin',
    email: 'admin1@gmail.com',
    password: 'Test123!',
    pin: '3333',
    phone: '+12133979823',
    country: 'country'
}

export const getVerificationCode = async (owner: string, codeType: string) => {
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

    return verificationCode?.code
}

export const verifyCode = async (email: string, codeType: string, code: string) => {
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

export const makeUserSuspend = async (data: object = {}, status: string) => {
    const formData = { ...userData, ...data }
    const user = await MODELS.UserModel.findOne({ email: formData.email }).exec()
    user?.set('status', status, String)
    user?.save()
}

export const getLoginCode = async (formData: any) => {
    const setting: any = await SettingService.getGlobalSetting()
    const codeType = setting.registrationRequireEmailVerified ? CODE_TYPE.Login : ''
    const owner = setting.registrationRequireEmailVerified ? formData.email : formData.phone

    const verificationCode = await MODELS.VerificationCode.findOne(
        {
            type: codeType,
            owner: owner
        },
        {},
        { sort: { created_at: -1 } }
    ).exec()
    expect(verificationCode?.code).exist

    return verificationCode?.code
}
