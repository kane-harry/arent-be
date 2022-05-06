import server from '@app/server'
import request from 'supertest'
import {validResponse} from "@app/test/init/db";

export const register = async (shareData: any, data: object = {}) => {
    const formData = {...userData, ...data}
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
