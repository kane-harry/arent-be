// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import request from 'supertest'
import { dbTest, MODELS, validResponse } from '../init/db'
import server from '@app/server'
import { adminData, initDataForUser, makeAdmin, makeUserSuspend, user1Data } from '@app/test/init/authenticate'
import { config } from '@config'
import { formatAmount, parsePrimeAmount } from '@utils/number'
import AccountService from '@modules/account/account.service'
import { FeeMode, UserStatus } from '@config/constants'
import { TransactionErrors } from '@exceptions/custom.error'
import SettingService from '@modules/setting/setting.service'

chai.use(chaiAsPromised)
const { expect, assert } = chai
const symbol = config.system.primeToken
let shareData1 = { user: {}, token: '', refreshToken: '', accounts: [], transactions: [] }
let shareData2 = { user: {}, token: '', refreshToken: '', accounts: [], transactions: [] }
let masterData = { user: {}, token: '', refreshToken: '', accounts: [], transactions: [], masterAccounts: [] }
const mintValue = 100
let currentSenderAmount = ''
let currentRecipientAmount = ''
const amountSend = 10
let feeConfig = null
describe('Transaction', () => {
    before(async () => {
        await dbTest.connect()
        const setting: any = await SettingService.getGlobalSetting()
        feeConfig = setting.primeTransferFee.toString()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        await initDataForUser(shareData1)
        await initDataForUser(shareData2, user1Data)
    }).timeout(10000)

    it('InitDataForAdmin', async () => {
        await initDataForUser(masterData, adminData)
        await makeAdmin(adminData)
    }).timeout(10000)

    it('GetAccountsByUser', async () => {
        const res1 = await request(server.app)
            .get(`/api/v1/accounts/user/${shareData1.user?.key}`)
            .set('Authorization', `Bearer ${shareData1.token}`)
            .send()
        expect(res1.status).equal(200)
        expect(res1.body).be.an('array')
        shareData1.accounts = res1.body

        const res2 = await request(server.app)
            .get(`/api/v1/accounts/user/${shareData2.user?.key}`)
            .set('Authorization', `Bearer ${shareData2.token}`)
            .send()
        expect(res2.status).equal(200)
        expect(res2.body).be.an('array')
        shareData2.accounts = res2.body
    }).timeout(10000)

    it('InitMasterAccounts', async () => {
        const res1 = await request(server.app).post(`/api/v1/master/accounts/`).set('Authorization', `Bearer ${masterData.token}`).send()
        expect(res1.status).equal(200)
    }).timeout(10000)

    it('GetMasterAccounts', async () => {
        const res1 = await request(server.app).get(`/api/v1/master/accounts/`).set('Authorization', `Bearer ${masterData.token}`).send()
        expect(res1.status).equal(200)
        masterData.masterAccounts = res1.body.filter(item => item.symbol === symbol)
    }).timeout(10000)

    it('MintMasterAccount', async () => {
        const sender = masterData.masterAccounts[0]
        const res1 = await request(server.app)
            .post(`/api/v1/master/accounts/${sender.key}/mint`)
            .set('Authorization', `Bearer ${masterData.token}`)
            .send({
                amount: mintValue,
                notes: 'mint master account',
                type: 'mint'
            })
        expect(res1.status).equal(200)
        currentSenderAmount = mintValue
    }).timeout(10000)

    it('Validate Sender Amount After Mint', async () => {
        const account = masterData.masterAccounts[0]
        const res = await request(server.app).get(`/api/v1/accounts/${account.key}`).set('Authorization', `Bearer ${masterData.token}`).send()
        expect(res.status).equal(200)
        validResponse(res.body)
        expect(res.body.amount).equal(mintValue)
    }).timeout(10000)

    context('Test case for FeeMode.Inclusive', () => {
        it('Send Funds 401', async () => {
            const sender = masterData.masterAccounts[0]
            const recipient = shareData2.accounts[0]
            const res = await request(server.app).post(`/api/v1/transactions/send`).send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: amountSend.toString(),
                nonce: '1',
                notes: 'test notes',
                mode: FeeMode.Inclusive
            })
            expect(res.status).equal(401)
        })

        it('Send Funds Wrong Sender', async () => {
            const sender = masterData.masterAccounts[0]
            const recipient = shareData2.accounts[0]
            const res = await request(server.app).post(`/api/v1/transactions/send`).set('Authorization', `Bearer ${shareData2.token}`).send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: amountSend.toString(),
                nonce: '1',
                notes: 'test notes',
                mode: FeeMode.Inclusive
            })
            expect(res.status).equal(400)
        })

        it('Send Funds', async () => {
            const amountWithoutFee = parseFloat(amountSend) - feeConfig
            const sender = masterData.masterAccounts[0]
            const recipient = shareData2.accounts[0]
            const res = await request(server.app).post(`/api/v1/transactions/send`).set('Authorization', `Bearer ${masterData.token}`).send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: amountSend.toString(),
                nonce: '1',
                notes: 'test notes',
                mode: FeeMode.Inclusive
            })
            expect(res.status).equal(200)
            expect(res.body.blockTime).be.an('number')
            expect(res.body.signature).be.an('string')
            expect(res.body.hash).be.an('string')
            expect(res.body.symbol).equal(symbol)
            expect(res.body.sender).equal(sender.address)
            expect(res.body.recipient).equal(recipient.address)
            expect(res.body.feeMode).equal(FeeMode.Inclusive)
            expect(Math.abs(res.body.amount)).equal(Math.abs(amountWithoutFee.toString()))

            // Send 10, fee 0.1
            // Inclusive:
            //      - Sender: -10
            //      - Recipient: +9.9
            //      - Fee: +0.1
            // If sender was admin (fee == sender):
            //      - Sender: -9.9
            const amountBigNumber = parsePrimeAmount(amountSend)
            const fee = parsePrimeAmount(feeConfig)
            const amountForSender = parsePrimeAmount(res.body.senderWallet.preBalance).sub(parsePrimeAmount(res.body.senderWallet.postBalance))
            const amountForRecipient = parsePrimeAmount(res.body.recipientWallet.postBalance).sub(
                parsePrimeAmount(res.body.recipientWallet.preBalance)
            )
            expect(amountForRecipient.toString()).equal(amountBigNumber.sub(fee).toString())

            const feeAccount = await AccountService.getMasterAccountBriefBySymbol(symbol)
            if (feeAccount.address === sender.address) {
                expect(amountForSender.toString()).equal(amountBigNumber.sub(fee).toString())
            } else {
                expect(amountForSender.toString()).equal(amountBigNumber.toString())
            }
            currentSenderAmount = res.body.senderWallet.postBalance
            currentRecipientAmount = res.body.recipientWallet.postBalance
        }).timeout(10000)

        it('Validate Sender Amount After Send', async () => {
            const account = masterData.masterAccounts[0]
            const res = await request(server.app).get(`/api/v1/accounts/${account.key}`).set('Authorization', `Bearer ${masterData.token}`).send()
            expect(res.status).equal(200)
            validResponse(res.body)
            expect(res.body.amount.toString()).equal(currentSenderAmount.toString())
        }).timeout(10000)

        it('Validate Recipient Amount After Send', async () => {
            const account = shareData2.accounts[0]
            const res = await request(server.app).get(`/api/v1/accounts/${account.key}`).set('Authorization', `Bearer ${shareData2.token}`).send()
            expect(res.status).equal(200)
            validResponse(res.body)
            expect(res.body.amount.toString()).equal(currentRecipientAmount.toString())
        }).timeout(10000)

        it('Validate Transaction Exist After Send', async () => {
            const account = masterData.masterAccounts[0]
            const res = await request(server.app)
                .get(`/api/v1/transactions/accounts/${account.key}`)
                .set('Authorization', `Bearer ${masterData.token}`)
                .send()
            expect(res.status).equal(200)
            validResponse(res.body)
            expect(res.body.txns.items.length).gt(0)
        }).timeout(10000)

        it('Validate Transaction Exist After Send', async () => {
            const account = shareData2.accounts[0]
            const res = await request(server.app)
                .get(`/api/v1/transactions/accounts/${account.key}`)
                .set('Authorization', `Bearer ${shareData2.token}`)
                .send()
            expect(res.status).equal(200)
            validResponse(res.body)
            expect(res.body.txns.items.length).gt(0)
        }).timeout(10000)
    })

    context('Test case for FeeMode.Exclusive', () => {
        it('Send Funds', async () => {
            const sender = masterData.masterAccounts[0]
            const recipient = shareData2.accounts[0]
            const res = await request(server.app).post(`/api/v1/transactions/send`).set('Authorization', `Bearer ${masterData.token}`).send({
                symbol: symbol,
                sender: sender.address,
                recipient: recipient.address,
                amount: amountSend.toString(),
                nonce: '1',
                notes: 'test notes',
                mode: FeeMode.Exclusive
            })
            expect(res.status).equal(200)
            expect(res.body.blockTime).be.an('number')
            expect(res.body.signature).be.an('string')
            expect(res.body.hash).be.an('string')
            expect(res.body.symbol).equal(symbol)
            expect(res.body.sender).equal(sender.address)
            expect(res.body.recipient).equal(recipient.address)
            expect(res.body.feeMode).equal(FeeMode.Exclusive)
            expect(Math.abs(res.body.amount)).equal(Math.abs(amountSend.toString()))

            // Send 10, fee 0.1
            // Exclusive:
            //     - Sender: -10.1
            //     - Recipient: +10
            //     - Fee: +0.1
            // If sender was admin (fee == sender):
            //     - Sender: -10
            const amountBigNumber = parsePrimeAmount(amountSend)
            const fee = parsePrimeAmount(feeConfig)
            const amountForSender = parsePrimeAmount(res.body.senderWallet.preBalance).sub(parsePrimeAmount(res.body.senderWallet.postBalance))
            const amountForRecipient = parsePrimeAmount(res.body.recipientWallet.postBalance).sub(
                parsePrimeAmount(res.body.recipientWallet.preBalance)
            )
            expect(amountForRecipient.toString()).equal(amountBigNumber.toString())

            const feeAccount = await AccountService.getMasterAccountBriefBySymbol(symbol)
            if (feeAccount.address === sender.address) {
                expect(amountForSender.toString()).equal(amountBigNumber.toString())
            } else {
                expect(amountForSender.toString()).equal(amountBigNumber.add(fee).toString())
            }
            currentSenderAmount = res.body.senderWallet.postBalance
            currentRecipientAmount = res.body.recipientWallet.postBalance
        }).timeout(10000)

        it('Validate Sender Amount After Send', async () => {
            const account = masterData.masterAccounts[0]
            const res = await request(server.app).get(`/api/v1/accounts/${account.key}`).set('Authorization', `Bearer ${masterData.token}`).send()
            expect(res.status).equal(200)
            validResponse(res.body)
            expect(res.body.amount.toString()).equal(currentSenderAmount.toString())
        }).timeout(10000)

        it('Validate Recipient Amount After Send', async () => {
            const account = shareData2.accounts[0]
            const res = await request(server.app).get(`/api/v1/accounts/${account.key}`).set('Authorization', `Bearer ${masterData.token}`).send()
            expect(res.status).equal(200)
            validResponse(res.body)
            expect(res.body.amount.toString()).equal(currentRecipientAmount.toString())
        }).timeout(10000)
    })

    it('Send Funds User Suspend', async () => {
        await makeUserSuspend(adminData, UserStatus.Suspend)
        const sender = masterData.masterAccounts[0]
        const recipient = shareData2.accounts[0]
        const res = await request(server.app).post(`/api/v1/transactions/send`).set('Authorization', `Bearer ${masterData.token}`).send({
            symbol: symbol,
            sender: sender.address,
            recipient: recipient.address,
            amount: amountSend.toString(),
            nonce: '1',
            notes: 'test notes',
            mode: FeeMode.Exclusive
        })
        expect(res.status).equal(400)
        await makeUserSuspend(adminData, UserStatus.Normal)
    })

    it('Send Funds Wrong Balance', async () => {
        const sender = masterData.masterAccounts[0]
        const recipient = shareData2.accounts[0]
        const res = await request(server.app).post(`/api/v1/transactions/send`).set('Authorization', `Bearer ${masterData.token}`).send({
            symbol: symbol,
            sender: sender.address,
            recipient: recipient.address,
            amount: 'kdkd',
            nonce: '1',
            notes: 'test notes',
            mode: FeeMode.Exclusive
        })
        expect(res.status).equal(500)
    })

    it('Send Funds Out Of Balance', async () => {
        const sender = masterData.masterAccounts[0]
        const recipient = shareData2.accounts[0]
        const res = await request(server.app).post(`/api/v1/transactions/send`).set('Authorization', `Bearer ${masterData.token}`).send({
            symbol: symbol,
            sender: sender.address,
            recipient: recipient.address,
            amount: '50000',
            nonce: '1',
            notes: 'test notes',
            mode: FeeMode.Exclusive
        })
        expect(res.status).equal(400)
        expect(res.body.error.code).equal(TransactionErrors.sender_insufficient_balance_error.code)
        expect(res.body.error.message).equal(TransactionErrors.sender_insufficient_balance_error.message)
    })

    it('Get Transactions by Account', async () => {
        const page_index = 1
        const page_size = 25
        const account = masterData.masterAccounts[0]
        const res = await request(server.app)
            .get(`/api/v1/transactions/accounts/${account.key}?page_index=${page_index}&page_size=${page_size}`)
            .set('Authorization', `Bearer ${masterData.token}`)
            .send()
        expect(res.status).equal(200)
        expect(res.body.account).be.an('object')
        expect(res.body.txns.items).be.an('array')
        expect(res.body.txns.totalCount).exist
        expect(res.body.txns.has_next_page).exist
        expect(res.body.txns.total_pages).exist
        expect(res.body.txns.page_index).equal(page_index)
        expect(res.body.txns.page_size).equal(page_size)
        shareData1.transactions = res.body.txns.items
    }).timeout(10000)

    it('Get Transactions', async () => {
        const page_index = 1
        const page_size = 25
        const res = await request(server.app).get(`/api/v1/transactions?page_index=${page_index}&page_size=${page_size}&terms=l`).send()
        expect(res.status).equal(200)
        // expect(res.body.account).be.an('object')
        expect(res.body.txns.items).be.an('array')
        expect(res.body.txns.totalCount).exist
        expect(res.body.txns.has_next_page).exist
        expect(res.body.txns.total_pages).exist
        expect(res.body.txns.page_index).equal(page_index)
        expect(res.body.txns.page_size).equal(page_size)
    }).timeout(10000)

    it('Get Transaction Detail', async () => {
        const account = masterData.masterAccounts[0]
        const transaction = shareData1.transactions[0]
        const res = await request(server.app).get(`/api/v1/transactions/txn/${transaction.key}`).send()
        expect(res.status).equal(200)
        expect(res.body.key).equal(transaction.key)
        expect(res.body.symbol).equal(symbol)
        expect(res.body.sender).equal(account.address)
        expect(res.body.type).equal(transaction.type)
    }).timeout(10000)

    it('Export Transactions by Account', async () => {
        const page_index = 1
        const page_size = 25
        const account = masterData.masterAccounts[0]
        const res = await request(server.app)
            .get(`/api/v1/transactions/export?symbol=${symbol}&key=${account.key}&page_index=${page_index}&page_size=${page_size}`)
            .set('Authorization', `Bearer ${masterData.token}`)
            .send()
            .send()
        expect(res.status).equal(200)
        expect(res.type).equal('text/csv')
        expect(res.charset).equal('utf-8')
        expect(res.text.length).gt(0)
    }).timeout(10000)
})
