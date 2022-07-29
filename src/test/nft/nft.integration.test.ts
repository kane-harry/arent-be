// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { initDataForUser } from '@app/test/init/authenticate'

chai.use(chaiAsPromised)
const { expect, assert } = chai
let shareData = {
    user: {
        email: ''
    },
    token: '',
    refreshToken: '',
    nfts: [],
    collections: []
}

const createNftData = {
    name: 'name',
    desc: 'desc',
    title: 'title',
    description: 'description',
    tags: 'tag1,tag2',
    price: 'price',
    currency: 'currency',
    metadata: 'metadata',
    type: 'type',
    amount: 'amount',
    attributes: [
        {
            trait_type: 'creator',
            value: '1upgaming.io'
        },
        {
            trait_type: 'stickers',
            value: 'https://console.filebase.com/object/1upgaming/7F88E24583A9058431572748E48C87BF529F3EDE5F54124B5811638D3FFCA403.zip'
        }
    ]
}
describe('NFT', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
    }).timeout(10000)

    it(`Create NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .field('name', createNftData.name)
            .field('title', createNftData.title)
            .field('description', createNftData.description)
            .field('tags', createNftData.tags)
            .field('price', createNftData.price)
            .field('currency', createNftData.currency)
            .field('metadata', createNftData.metadata)
            .field('type', createNftData.type)
            .field('amount', createNftData.amount)
            .field('attributes', JSON.stringify(createNftData.attributes))
            .field('collection_key', shareData.collections[0].key)
            .attach('nft', './src/test/init/test.jpeg')
            .attach('images', './src/test/init/test.jpeg')
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: res.body.key })
        //Form data
        expect(nft.name).equal(createNftData.name)
        expect(nft.title).equal(createNftData.title)
        expect(nft.description).equal(createNftData.description)
        expect(nft.tags).equal(createNftData.tags)
        expect(nft.price).equal(createNftData.price)
        expect(nft.currency).equal(createNftData.currency)
        expect(nft.metadata).equal(createNftData.metadata)
        expect(nft.type).equal(createNftData.type)
        expect(nft.amount).equal(createNftData.amount)
        expect(nft.attributes).equal(createNftData.attributes)

        //Generate
        expect(nft.image.normal.length).gt(0)
        expect(nft.image.thumb.length).gt(0)
        expect(nft.images.length).gt(0)
        expect(nft.on_market).exist
        expect(nft.nft_token_id).exist
        expect(nft.status).exist

        //Relation
        expect(nft.collection_key).equal(shareData.collections[0].key)
        expect(nft.creator).equal(shareData.user.key)
        expect(nft.owner).equal(shareData.user.key)
    }).timeout(10000)
})
