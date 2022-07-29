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

const updateNftData = {
    owner: '',
    status: '',
    on_market: ''
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

    it(`Create collection`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/collections`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .field('name', createCollectionData.name)
            .field('description', createCollectionData.description)
            .field('type', createCollectionData.type)
            .attach('logo', './src/test/init/test.jpeg')
            .attach('background', './src/test/init/test.jpeg')
        expect(res.status).equal(200)
        validResponse(res.body)
        const collection = await CollectionModel.findOne({ key: res.body.key })
        //Form data
        expect(collection.name).equal(createCollectionData.name)
        expect(collection.description).equal(createCollectionData.description)
        expect(collection.type).equal(createCollectionData.type)

        //Generate
        expect(collection.logo.length).gt(0)
        expect(collection.background.length).gt(0)
        expect(items_count).exist

        //Relation
        expect(collection.creator).equal(shareData.user.key)
        expect(collection.owner).equal(shareData.user.key)
    }).timeout(10000)

    it(`List Collections`, async () => {
        const res = await request(server.app).get(`/api/v1/collections`)
        expect(res.status).equal(200)
        validResponse(res.body)
        shareData.collections = res.body.items
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

    it(`List NFTs`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`My NFTs`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts/${shareData.user.key}`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        shareData.nfts = res.body.items
    }).timeout(10000)

    it(`Get NFT Detail`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts/${shareData.nfts[0].key}`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.name).equal(res.body.name)
        expect(nft.title).equal(res.body.title)
        expect(nft.description).equal(res.body.description)
        expect(nft.tags).equal(res.body.tags)
        expect(nft.price).equal(res.body.price)
        expect(nft.currency).equal(res.body.currency)
        expect(nft.metadata).equal(res.body.metadata)
        expect(nft.type).equal(res.body.type)
        expect(nft.amount).equal(res.body.amount)
        expect(nft.attributes).equal(res.body.attributes)

        //Generate
        expect(nft.image.normal).equal(res.body.image.normal)
        expect(nft.image.thumb).equal(res.body.image.thumb)
        expect(nft.images).equal(res.body.images)
        expect(nft.on_market).equal(res.body.on_market)
        expect(nft.nft_token_id).equal(res.body.nft_token_id)
        expect(nft.status).equal(res.body.status)

        //Relation
        expect(nft.collection_key).equal(res.body.collection_key)
        expect(nft.creator).equal(res.body.creator)
        expect(nft.owner).equal(res.body.owner)
    }).timeout(10000)

    it(`Export NFT`, async () => {
        const res = await request(server.app).post(`/api/v1/nfts/${shareData.nfts[0].key}/export`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        // TODO I don't known what logic for export nft, add later
    }).timeout(10000)

    it(`Import NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/import`)
            .field('user_key', createNftData.user_key)
            .field('contract_address', createNftData.contract_address)
            .field('token_id', createNftData.token_id)
            .field('network', createNftData.network)
            .field('type', createNftData.type)
            .field('status', createNftData.status)
        expect(res.status).equal(200)
        validResponse(res.body)
        // TODO I don't known what logic for import nft, add later
    }).timeout(10000)

    it(`Update NFT`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/nfts/${shareData.nfts[0].key}`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .field('owner', updateNftData.owner)
            .field('status', updateNftData.status)
            .field('on_market', updateNftData.on_market)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.owner).equal(updateNftData.owner)
        expect(nft.status).equal(updateNftData.status)
        expect(nft.on_market).equal(updateNftData.on_market)
    }).timeout(10000)

    it(`Burn NFT`, async () => {
        const res = await request(server.app).delete(`/api/v1/nfts/${shareData.nfts[0].key}`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.removed).equal(true)
    }).timeout(10000)
})
