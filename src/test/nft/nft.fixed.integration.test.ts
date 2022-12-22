// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'
import { CollectionModel } from '@modules/collection/collection.model'
import { NftModel, NftOwnershipLogModel } from '@modules/nft/nft.model'
import { AccountType, CollectionType, FeeMode, NftStatus, NftType } from '@config/constants'
import { AccountModel } from '@modules/account/account.model'
import CollectionService from '@modules/collection/collection.service'
import UserService from '@modules/user/user.service'

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

let adminShareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [], masterAccounts: [] }

const createNftData = {
    name: 'name',
    desc: 'desc',
    description: 'description',
    price: 5000,
    num_sales: 1,
    quantity: 1,
    royalty: 0.01,
    currency: 'LL',
    nft_token_id: '232423432',
    meta_data: [
        {
            player: 'Ronaldo',
            year: 2020
        }
    ],
    type: NftType.ERC1155,
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

const createCollectionData = {
    name: 'collection name',
    description: 'collection description',
    type: CollectionType.Default
}

const sellData = {
    price: 1,
    price_type: 'fixed',
    description_append: 'Sell description'
}
const buyData = { symbol: createNftData.currency }

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

    it('InitDataForAdmin', async () => {
        await initDataForUser(adminShareData, adminData)
        await makeAdmin(adminData)
    }).timeout(10000)

    it('InitMasterAccounts', async () => {
        const res1 = await request(server.app).post(`/api/v1/accounts/master`).set('Authorization', `Bearer ${adminShareData.token}`).send()
        expect(res1.status).equal(200)
    }).timeout(10000)

    it('GetMasterAccounts', async () => {
        const accounts = await AccountModel.find({ user_key: AccountType.Master, removed: false })
        expect(accounts.length).gt(0)
        adminShareData.masterAccounts = accounts.filter(item => item.symbol === createNftData.currency)

        const accounts2 = await AccountModel.find({ user_key: adminShareData.user.key, removed: false })
        expect(accounts2.length).gt(0)
        adminShareData.accounts = accounts2.filter(item => item.symbol === createNftData.currency)
    }).timeout(10000)

    it('MintMasterAccount', async () => {
        const sender = adminShareData.masterAccounts[0]
        const res1 = await request(server.app)
            .post(`/api/v1/accounts/${sender.key}/mint`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send({
                amount: 40996.3,
                notes: 'mint master account',
                type: 'mint'
            })
        expect(res1.status).equal(200)
        validResponse(res1.body)
    }).timeout(10000)

    it('Send Funds', async () => {
        const sender = adminShareData.masterAccounts[0]
        const recipient = adminShareData.accounts[0]
        const amountSend = 10
        const res = await request(server.app).post(`/api/v1/transactions`).set('Authorization', `Bearer ${adminShareData.token}`).send({
            symbol: createNftData.currency,
            sender: sender.address,
            recipient: recipient.address,
            amount: amountSend.toString(),
            nonce: '1',
            notes: 'test notes',
            mode: FeeMode.Inclusive
        })
        expect(res.status).equal(200)
    }).timeout(30000)

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
        shareData.collections[0] = collection
    }).timeout(20000)

    it(`Create NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .field('name', createNftData.name)
            .field('description', createNftData.description)
            .field('price', createNftData.price)
            .field('currency', createNftData.currency)
            .field('meta_data', JSON.stringify(createNftData.meta_data))
            .field('type', createNftData.type)
            .field('attributes', JSON.stringify(createNftData.attributes))
            .field('collection_key', shareData.collections[0].key)
            .field('num_sales', createNftData.num_sales)
            .field('quantity', createNftData.quantity)
            .field('royalty', createNftData.royalty)
            .attach('animation', './src/test/init/test.mp4')
            .attach('image', './src/test/init/test.jpeg')
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: res.body.key })
        shareData.nfts[0] = nft
    }).timeout(30000)

    it(`Approved NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/status`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send({ status: NftStatus.Approved, keys: [shareData.nfts[0].key] })
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.status).equal(NftStatus.Approved)
    }).timeout(10000)

    it(`market/off NFT`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/nfts/${shareData.nfts[0].key}/market/off`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(sellData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.on_market).equal(false)
    }).timeout(10000)

    it(`market/on NFT`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/nfts/${shareData.nfts[0].key}/market/on`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(sellData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.on_market).equal(true)
    }).timeout(10000)

    it(`Buy NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/${shareData.nfts[0].key}/buy`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send(buyData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.on_market).equal(false)
        expect(nft.owner).equal(adminShareData.user.token)
    }).timeout(20000)

    it(`Price History`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts/${shareData.nfts[0].key}`)
        expect(res.status).equal(200)
        validResponse(res.body)
        const histories = await NftOwnershipLogModel.find({ nft_key: shareData.nfts[0].key })
        expect(histories.length).equal(res.body.price_histories.length)
    }).timeout(10000)

    it('Get Collection Analytics', async () => {
        const res = await request(server.app)
            .get(`/api/v1/collections/${shareData.collections[0].key}/analytics`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.nft_count).exist
        expect(res.body.owner_count).exist
        expect(res.body.floor_price).exist
        expect(res.body.volume).exist
        expect(res.body.volume_last).exist
        expect(res.body.sales_count).exist
    }).timeout(10000)

    it('Get Collection Ranking', async () => {
        const res = await request(server.app)
            .get(`/api/v1/collections/${shareData.collections[0].key}/ranking`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.collection_key).equal(shareData.collections[0].key)
    }).timeout(10000)

    it(`Gen collection ranking`, async () => {
        await CollectionService.generateCollectionRanking(shareData.collections[0].key)
    }).timeout(10000)

    it(`Get collection ranking`, async () => {
        const res = await request(server.app).get(`/api/v1/collections/rankings`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`Gen user ranking`, async () => {
        await UserService.generateUserRanking(shareData.user.key)
    }).timeout(10000)

    it(`Get user ranking`, async () => {
        const res = await request(server.app).get(`/api/v1/users/rankings`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
    }).timeout(10000)

    it(`Get nft sale logs`, async () => {
        const res = await request(server.app)
            .get(`/api/v1/nfts/${shareData.nfts[0].key}/sales/logs`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.symbol).equal(shareData.nfts[0].currency)
        expect(res.body.chart.length).gt(0)
    }).timeout(10000)

    it(`Get collection sale logs`, async () => {
        const res = await request(server.app)
            .get(`/api/v1/collections/${shareData.collections[0].key}/sales/logs`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.items.length).gt(0)
    }).timeout(10000)
})
