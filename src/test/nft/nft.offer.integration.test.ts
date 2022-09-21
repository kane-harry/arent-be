// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser, makeAdmin } from '@app/test/init/authenticate'
import { CollectionModel } from '@modules/collection/collection.model'
import { NftModel, NftOfferModel } from '@modules/nft/nft.model'
import { AccountType, FeeMode, NftPriceType, NftStatus, OfferStatusType } from '@config/constants'
import { AccountModel } from '@modules/account/account.model'
import AccountService from '@modules/account/account.service'

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

let firstOfferShareData = {
    user: {
        email: ''
    },
    token: '',
    refreshToken: '',
    nfts: [],
    collections: [],
    accounts: []
}

let secondOfferShareData = {
    user: {
        email: ''
    },
    token: '',
    refreshToken: '',
    nfts: [],
    collections: [],
    accounts: []
}

let adminShareData = { user: { key: '' }, token: '', refreshToken: '', accounts: [], masterAccounts: [] }

const createNftData = {
    name: 'name',
    desc: 'desc',
    description: 'description',
    price: 3,
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
    type: 'erc721',
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
    type: 'sports'
}
const sellData = {
    price: 1,
    description_append: 'Sell description'
}
const buyData = { symbol: createNftData.currency, amount: 1 }
const buyData2 = { symbol: createNftData.currency, amount: 2 }

describe('NFT', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData)
        await initDataForUser(firstOfferShareData, { email: 'abc-test-second@gmail.com', phone: '+84988085978' })
        await initDataForUser(secondOfferShareData, { email: 'abc-test-third@gmail.com', phone: '+84988085979' })
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
        const accounts = await AccountModel.find({ user_key: AccountType.Master, removed: false, symbol: createNftData.currency })
        expect(accounts.length).gt(0)
        adminShareData.masterAccounts = accounts

        const accounts2 = await AccountModel.find({ user_key: adminShareData.user.key, removed: false, symbol: createNftData.currency })
        expect(accounts2.length).gt(0)
        adminShareData.accounts = accounts2
    }).timeout(10000)

    it('Get Offer Accounts', async () => {
        const accounts = await AccountModel.find({ user_key: firstOfferShareData.user.key, removed: false, symbol: createNftData.currency })
        expect(accounts.length).gt(0)
        firstOfferShareData.accounts = accounts

        const accounts2 = await AccountModel.find({ user_key: secondOfferShareData.user.key, removed: false, symbol: createNftData.currency })
        expect(accounts2.length).gt(0)
        secondOfferShareData.accounts = accounts2
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

    it('Send Funds to first offers', async () => {
        const sender = adminShareData.masterAccounts[0]
        const recipient = firstOfferShareData.accounts[0]
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

    it('Send Funds to second offers', async () => {
        const sender = adminShareData.masterAccounts[0]
        const recipient = secondOfferShareData.accounts[0]
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
            .put(`/api/v1/nfts/${shareData.nfts[0].key}/status`)
            .set('Authorization', `Bearer ${adminShareData.token}`)
            .send({ status: NftStatus.Approved })
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
    }).timeout(20000)

    it(`market/on NFT`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/nfts/${shareData.nfts[0].key}/market/on`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(sellData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.on_market).equal(true)
    }).timeout(20000)

    it(`Owner NFT offer NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/${shareData.nfts[0].key}/offers`)
            .set('Authorization', `Bearer ${shareData.token}`)
            .send(buyData)
        expect(res.status).equal(400)
    }).timeout(20000)

    it(`First offer NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/${shareData.nfts[0].key}/offers`)
            .set('Authorization', `Bearer ${firstOfferShareData.token}`)
            .send(buyData)
        expect(res.status).equal(200)
        validResponse(res.body)

        const account = await AccountService.getAccountByUserKeyAndSymbol(firstOfferShareData.user.key, createNftData.currency)
        expect(account.amount_locked.toString()).equal(buyData.amount.toString())
    }).timeout(20000)

    it(`First offer NFT again`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/${shareData.nfts[0].key}/offers`)
            .set('Authorization', `Bearer ${firstOfferShareData.token}`)
            .send(buyData2)
        expect(res.status).equal(400)
    }).timeout(20000)

    it(`Second offer NFT`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/${shareData.nfts[0].key}/offers`)
            .set('Authorization', `Bearer ${secondOfferShareData.token}`)
            .send(buyData2)
        expect(res.status).equal(200)
        validResponse(res.body)

        const account = await AccountService.getAccountByUserKeyAndSymbol(secondOfferShareData.user.key, createNftData.currency)
        expect(account.amount_locked.toString()).equal(buyData2.amount.toString())
    }).timeout(20000)

    it(`Get Offers`, async () => {
        const res = await request(server.app).get(`/api/v1/nfts/${shareData.nfts[0].key}/offers`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.length).gt(0)
        shareData.offers = res.body
    }).timeout(20000)

    it(`Reject first offer`, async () => {
        const offer = shareData.offers[1]
        const res = await request(server.app).post(`/api/v1/nfts/offers/${offer.key}/reject`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)

        const firstOfferAccount = await AccountService.getAccountByUserKeyAndSymbol(firstOfferShareData.user.key, createNftData.currency)
        expect(firstOfferAccount.amount_locked.toString()).equal('0')
    }).timeout(20000)

    it(`Accept second offer`, async () => {
        const offer = shareData.offers[0]
        const res = await request(server.app).post(`/api/v1/nfts/offers/${offer.key}/accept`).set('Authorization', `Bearer ${shareData.token}`).send()
        expect(res.status).equal(200)

        const secondOfferAccount = await AccountService.getAccountByUserKeyAndSymbol(secondOfferShareData.user.key, createNftData.currency)
        expect(secondOfferAccount.amount_locked.toString()).equal('0')

        const nft2 = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft2.owner_key).equal(secondOfferShareData.user.key)
    }).timeout(20000)

    it(`market/on NFT`, async () => {
        const res = await request(server.app)
            .put(`/api/v1/nfts/${shareData.nfts[0].key}/market/on`)
            .set('Authorization', `Bearer ${secondOfferShareData.token}`)
            .send(sellData)
        expect(res.status).equal(200)
        validResponse(res.body)
        const nft = await NftModel.findOne({ key: shareData.nfts[0].key })
        expect(nft.on_market).equal(true)
    }).timeout(20000)

    it(`First offer NFT again`, async () => {
        const res = await request(server.app)
            .post(`/api/v1/nfts/${shareData.nfts[0].key}/offers`)
            .set('Authorization', `Bearer ${firstOfferShareData.token}`)
            .send(buyData2)
        expect(res.status).equal(200)
        validResponse(res.body)
        const account = await AccountService.getAccountByUserKeyAndSymbol(firstOfferShareData.user.key, createNftData.currency)
        expect(account.amount_locked.toString()).equal(buyData2.amount.toString())
    }).timeout(20000)

    it(`Cancel First offer`, async () => {
        const offers = await NftOfferModel.find({ status: OfferStatusType.Pending, user_key: firstOfferShareData.user.key })
        const res = await request(server.app)
            .post(`/api/v1/nfts/offers/${offers[0].key}/cancel`)
            .set('Authorization', `Bearer ${firstOfferShareData.token}`)
            .send()
        expect(res.status).equal(200)
        validResponse(res.body)
        const account = await AccountService.getAccountByUserKeyAndSymbol(firstOfferShareData.user.key, createNftData.currency)
        expect(account.amount_locked.toString()).equal('0')
    }).timeout(20000)
})
