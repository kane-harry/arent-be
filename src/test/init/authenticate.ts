// @ts-nocheck
import server from '@app/server'
import request from 'supertest'
import { MODELS, validResponse } from '@app/test/init/db'
import chai from 'chai'
import { role } from '@config/role'
import SettingService from '@modules/setting/setting.service'
import { CodeType } from '@config/constants'
import UserModel from '@modules/user/user.model'
const { expect } = chai

export const initDataForUser = async (shareData: any, data: object = {}) => {
    const formData = { ...userData, ...data }
    const setting: any = await SettingService.getGlobalSetting()
    if (setting.registration_require_email_verified) {
        const code = await getVerificationCode(formData.email, CodeType.EmailRegistration)
        await verifyCode(formData.email, CodeType.EmailRegistration, code)
    }

    if (setting.registration_require_phone_verified) {
        const code = await getVerificationCode(formData.phone, CodeType.PhoneRegistration)
        await verifyCode(formData.phone, CodeType.PhoneRegistration, code)
    }

    const registerRes = await request(server.app).post('/api/v1/users/register').send(formData)
    validResponse(registerRes.body)
    expect(registerRes.status).equal(200)

    let loginRes = await request(server.app).post('/api/v1/auth/login').send({ email: formData.email, password: formData.password })
    if (!loginRes.body.token) {
        const loginCode = await getLoginCode(formData)
        loginRes = await request(server.app).post('/api/v1/auth/login').send({ email: formData.email, password: formData.password, token: loginCode })
    }
    validResponse(loginRes.body)
    expect(loginRes.status).equal(200)

    shareData.user = loginRes.body.user
    shareData.token = loginRes.body.token
    shareData.refreshToken = loginRes.body.refreshToken

    return loginRes
}

export const userData = {
    first_name: 'John',
    last_name: 'Smith',
    chatName: 'jsmith8',
    email: 'email@gmail.com',
    password: 'Test123!',
    pin: '1111',
    phone: '+84988085977',
    country: 'country'
}

export const user1Data = {
    first_name: 'John',
    last_name: 'Smith',
    chatName: 'jsmith9',
    email: 'email1@gmail.com',
    password: 'Test123!',
    pin: '2222',
    phone: '+79366199804',
    country: 'country'
}

export const adminData = {
    first_fame: 'John',
    last_lame: 'Smith',
    chatName: 'admin',
    email: 'admin1@gmail.com',
    password: 'Test123!',
    pin: '3333',
    phone: '+12133979823',
    country: 'country'
}

export const getVerificationCode = async (owner: string, codeType: string) => {
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

    return verificationCode?.code
}

export const verifyCode = async (email: string, codeType: string, code: string) => {
    const res = await request(server.app).post('/api/v1/verification/code/verify').send({
        code_type: codeType,
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
    await user?.save()
}

export const makeUserSuspend = async (data: object = {}, status: string) => {
    const formData = { ...userData, ...data }
    const user = await MODELS.UserModel.findOne({ email: formData.email }).exec()
    user?.set('status', status, String)
    user?.save()
}

export const getLoginCode = async (formData: any) => {
    const user = await UserModel.findOne({ email: formData.email })
    const setting: any = await SettingService.getGlobalSetting()
    const codeType = setting.registration_require_email_verified ? CodeType.Login : ''
    const owner = user.key

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
