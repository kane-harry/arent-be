import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { IArticle } from '@modules/article/article.interface'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'
import { ArticleType } from '@config/constants'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = { user: { key: '' }, token: '', refreshToken: '', articles: [] }
let shareMasterData = { user: {}, token: '', refreshToken: '', articles: [], transactions: [], masterArticles: [] }
let createArticleData = {
    title: 'title',
    tags: 'tags1,tags2,tags3',
    type: ArticleType.Guide,
    short_description: 'short_description',
    content: 'content'
}
describe('Article', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
    }).timeout(10000)

    it('InitDataForAdmin', async () => {
        await initDataForUser(shareMasterData, adminData)
        await makeAdmin(adminData)
    }).timeout(10000)

    it(`Create article`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/articles`)
            .set('Authorization', `Bearer ${shareMasterData.token}`)
            .field('title', createArticleData.title)
            .field('tags', createArticleData.tags)
            .field('type', createArticleData.type)
            .field('short_description', createArticleData.short_description)
            .field('content', createArticleData.content)
            .attach('cover_image', './src/test/init/test.gif')
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.title).equal(createArticleData.title)
        expect(res.body.tags).equal(createArticleData.tags)
        expect(res.body.type).equal(createArticleData.type)
        expect(res.body.short_description).equal(createArticleData.short_description)
        expect(res.body.content).equal(createArticleData.content)
    }).timeout(40000)

    it('QueryArticles', async () => {
        const page_index = 1
        const page_size = 25
        const res = await request(server.app)
            .get(`/api/v1/articles?page_index=${page_index}&page_size=${page_size}`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.items).be.an('array')
        expect(res.body.total_count).exist
        expect(res.body.has_next_page).exist
        expect(res.body.total_pages).exist
        expect(res.body.page_index).equal(page_index)
        expect(res.body.page_size).equal(page_size)
        shareData.articles = res.body.items
        expect(res.body.items.length).gt(0)
    }).timeout(10000)

    it('GetArticleDetail', async () => {
        const article: IArticle = shareData.articles[0]
        const res = await request(server.app).get(`/api/v1/articles/${article.key}`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)

        expect(res.body.key).equal(article.key)
    }).timeout(10000)
})
