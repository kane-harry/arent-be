import server from '@app/server'
import request from 'supertest'

export const login = async (payload: { email: string; password: string }) => {
    return await request(server.app).post('/auth/login').send({
        email: payload.email,
        password: payload.password
    })
}
