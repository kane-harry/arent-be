// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { initDataForUser } from '@app/test/init/authenticate'
import { CollectionModel } from '@modules/collection/collection.model'
import { NftModel } from '@modules/nft/nft.model'

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
    price: 5000,
    currency: 'LL',
    nft_token_id: '232423432',
    metadata: [
        {
            player: 'Ronaldo',
            year: 2020
        }
    ],
    type: 'type',
    amount: 1,
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
    owner: 'safdsafsf',
    status: 'on_sale',
    on_market: false
}

const createCollectionData = {
    name: 'collection name',
    description: 'collection description',
    type: 'sports'
}

const updateCollectionData = {
    name: 'update collection name',
    description: 'update collection description'
}

const importNftData = {
    user_key: '',
    contract_address: '',
    token_id: '',
    network: '',
    type: '',
    status: ''
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
        expect(collection.items_count).exist

        //Relation
        expect(collection.creator).equal(shareData.user.key)
        expect(collection.owner).equal(shareData.user.key)
    }).timeout(20000)

    it(`List Collections`, async () => {
        const res = await request(server.app).get(`/api/v1/collections`)
        expect(res.status).equal(200)
        validResponse(res.body)
        shareData.collections = res.body.items
    }).timeout(10000)

    it(`Get Collection Detail`, async () => {
        const res = await request(server.app).get(`/api/v1/collections/${shareData.collections[0].key}`)
        expect(res.status).equal(200)
        validResponse(res.body)

        const collection = await CollectionModel.findOne({ key: shareData.collections[0].key })
        expect(collection.name).equal(res.body.collection.name)
        expect(collection.description).equal(res.body.collection.description)
        expect(collection.type).equal(res.body.collection.type)
        expect(collection.logo).equal(res.body.collection.logo)
        expect(collection.background).equal(res.body.collection.background)
        expect(collection.items_count).equal(res.body.collection.items_count)
        expect(collection.creator).equal(res.body.collection.creator)
        expect(collection.owner).equal(res.body.collection.owner)
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
            .field('metadata', JSON.stringify(createNftData.metadata))
            .field('type', createNftData.type)
            .field('amount', createNftData.amount)
            .field('nft_token_id', createNftData.nft_token_id)
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
        expect(nft.price.toString()).equal(createNftData.price.toString())
        expect(nft.currency).equal(createNftData.currency)
        expect(nft.metadata[0].year).equal(createNftData.metadata[0].year)
        expect(nft.metadata[0].player).equal(createNftData.metadata[0].player)
        expect(nft.type).equal(createNftData.type)
        expect(nft.amount).equal(createNftData.amount)
        expect(nft.nft_token_id).equal(createNftData.nft_token_id)
        expect(nft.attributes[0].trait_type).equal(createNftData.attributes[0].trait_type)
        expect(nft.attributes[0].value).equal(createNftData.attributes[0].value)
        expect(nft.attributes[1].trait_type).equal(createNftData.attributes[1].trait_type)
        expect(nft.attributes[1].value).equal(createNftData.attributes[1].value)

        //Generate
        expect(nft.image.normal.length).gt(0)
        expect(nft.image.thumb.length).gt(0)
        expect(nft.images.length).gt(0)
        expect(nft.on_market).exist
        expect(nft.status).exist

        //Relation
        expect(nft.collection_key).equal(shareData.collections[0].key)
        expect(nft.creator).equal(shareData.user.key)
        expect(nft.owner).equal(shareData.user.key)
    }).timeout(20000)

    it(`List User Collections`, async () => {
        const res = await request(server.app).get(`/api/v1/collections/user/${shareData.user.key}`)
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`List User Collections`, async () => {
        const res = await request(server.app).get(`/api/v1/collections/user/${shareData.user.key}?include_all=true`)
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`List NFTs`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts`)
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`List NFTs by terms`, async () => {
        const terms = 'nam'
        const res = await request(server.app).get(`/api/v1/nfts?terms=${terms}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const items = res.body.items.filter(
            item => !(item.name.includes(terms) || item.description.includes(terms) || item.title.includes(terms) || item.tags.includes(terms))
        )
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List NFTs by owner`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts?owner=${shareData.user.key}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const items = res.body.items.filter(item => item.owner !== shareData.user.key)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List NFTs by price_min`, async () => {
        const price = 0
        const res = await request(server.app).get(`/api/v1/nfts?price_min=${price}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const items = res.body.items.filter(item => item.price_min < price)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List NFTs by price_max`, async () => {
        const price = 1000
        const res = await request(server.app).get(`/api/v1/nfts?price_max=${price}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const items = res.body.items.filter(item => item.price_max > price)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List NFTs by collection_key`, async () => {
        const collectionKey = shareData.collections[0].key
        const res = await request(server.app).get(`/api/v1/nfts?collection_key=${collectionKey}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const items = res.body.items.filter(item => item.collection_key !== collectionKey)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`List NFTs by on_market`, async () => {
        const market = true
        const res = await request(server.app).get(`/api/v1/nfts?on_market=${market}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const items = res.body.items.filter(item => item.market !== market)
        expect(items.length).equal(0)
    }).timeout(10000)

    it(`My NFTs`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts/users/${shareData.user.key}`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        shareData.nfts = res.body.items
    }).timeout(10000)

    it(`Get NFT Detail`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts/${shareData.nfts[0].key}`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.name).equal(res.body.nft.name)
        expect(nft.title).equal(res.body.nft.title)
        expect(nft.description).equal(res.body.nft.description)
        expect(nft.tags).equal(res.body.nft.tags)
        expect(nft.price.toString()).equal(res.body.nft.price.toString())
        expect(nft.currency).equal(res.body.nft.currency)
        expect(nft.metadata[0].year).equal(res.body.nft.metadata[0].year)
        expect(nft.metadata[0].player).equal(res.body.nft.metadata[0].player)
        expect(nft.type).equal(res.body.nft.type)
        expect(nft.amount).equal(res.body.nft.amount)
        expect(nft.nft_token_id).equal(res.body.nft.nft_token_id)
        expect(nft.attributes[0].trait_type).equal(res.body.nft.attributes[0].trait_type)
        expect(nft.attributes[0].value).equal(res.body.nft.attributes[0].value)
        expect(nft.attributes[1].trait_type).equal(res.body.nft.attributes[1].trait_type)
        expect(nft.attributes[1].value).equal(res.body.nft.attributes[1].value)

        //Generate
        expect(nft.image.normal).equal(res.body.nft.image.normal)
        expect(nft.image.thumb).equal(res.body.nft.image.thumb)
        expect(JSON.stringify(nft.images)).equal(JSON.stringify(res.body.nft.images))
        expect(nft.on_market).equal(res.body.nft.on_market)
        expect(nft.status).equal(res.body.nft.status)

        //Relation
        expect(nft.collection_key).equal(res.body.nft.collection_key)
        expect(nft.creator).equal(res.body.nft.creator)
        expect(nft.owner).equal(res.body.nft.owner)
    }).timeout(10000)

    it(`Update NFT`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/nfts/${shareData.nfts[0].key}`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(updateNftData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.owner).equal(updateNftData.owner)
        expect(nft.status).equal(updateNftData.status)
        expect(nft.on_market).equal(updateNftData.on_market)
    }).timeout(10000)

    it(`Burn NFT`, async () => {
        await NftModel.updateOne({ key: shareData.nfts[0].key }, { $set: { owner: shareData.user.key } }, { upsert: true }).exec()
        const res = await request(server.app).delete(`/api/v1/nfts/${shareData.nfts[0].key}`).set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.owner).equal('00000000000000000000000000000000')
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
            .field('user_key', importNftData.user_key)
            .field('contract_address', importNftData.contract_address)
            .field('token_id', importNftData.token_id)
            .field('network', importNftData.network)
            .field('type', importNftData.type)
            .field('status', importNftData.status)
        expect(res.status).equal(200)
        validResponse(res.body)
        // TODO I don't known what logic for import nft, add later
    }).timeout(10000)

    it(`Update collection`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/collections/${shareData.collections[0].key}`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .field('name', updateCollectionData.name)
            .field('description', updateCollectionData.description)
            .attach('logo', './src/test/init/test.jpeg')
            .attach('background', './src/test/init/test.jpeg')
        expect(res.status).equal(200)
        validResponse(res.body)
        const collection = await CollectionModel.findOne({ key: res.body.key })
        //Form data
        expect(collection.name).equal(updateCollectionData.name)
        expect(collection.description).equal(updateCollectionData.description)

        //Generate
        expect(collection.logo.length).gt(0)
        expect(collection.background.length).gt(0)
    }).timeout(10000)

    it(`Assign collection`, async () => {
        const new_owner = 'new_owner'
        const res = await request(server.app)
            .put(`/api/v1/collections/${shareData.collections[0].key}/assign`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send({ user_key: new_owner })
        expect(res.status).equal(200)
        validResponse(res.body)
        const collection = await CollectionModel.findOne({ key: res.body.key })
        expect(collection.owner).equal(new_owner)

        //Reset owner
        collection.set('owner', shareData.user.key, String)
        await collection.save()
    }).timeout(10000)

    it(`Delete Collection`, async () => {
        const res = await request(server.app)
            .delete(`/api/v1/collections/${shareData.collections[0].key}`)
            .set('Authorization', `Bearer ${shareData.token}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const collection = await CollectionModel.findOne({ key: shareData.collections[0].key })
        expect(collection.removed).equal(true)
        expect(collection.items_count).equal(0)
    }).timeout(10000)
})
