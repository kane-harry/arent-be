import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { ICategory } from '@modules/category/category.interface'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareMasterData = { user: {}, token: '', refreshToken: '', categories: [], transactions: [], masterCategories: [] }
const createCategoryData = {
    name: 'aaa',
    description: 'aaa'
}
const updateCategoryData = {
    name: 'aaab',
    description: 'aaab'
}
describe('Category', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForAdmin', async () => {
        await initDataForUser(shareMasterData, adminData)
        await makeAdmin(adminData)
    }).timeout(10000)

    it('Create Category', async () => {
        const res = await request(server.app)
            .post(`/api/v1/categories`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send(createCategoryData)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.name).equal(createCategoryData.name)
        expect(res.body.description).equal(createCategoryData.description)
    }).timeout(10000)

    it('Query Categories', async () => {
        const page_index = 1
        const page_size = 25
        const res = await request(server.app)
            .get(`/api/v1/categories?page_index=${page_index}&page_size=${page_size}`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        shareMasterData.categories = res.body
    }).timeout(10000)

    it('Get Category Detail', async () => {
        const category: ICategory = shareMasterData.categories[0]
        const res = await request(server.app).get(`/api/v1/categories/${category.key}`).set('Authorization', `Bearer ${shareMasterData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it('Update Category', async () => {
        const category: ICategory = shareMasterData.categories[0]
        const res = await request(server.app)
            .put(`/api/v1/categories/${category.key}`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send(updateCategoryData)
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.name).equal(updateCategoryData.name)
        expect(res.body.description).equal(updateCategoryData.description)
    }).timeout(10000)

    it('Delete Category', async () => {
        const category: ICategory = shareMasterData.categories[0]
        const res = await request(server.app)
            .delete(`/api/v1/categories/${category.key}`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)
})
