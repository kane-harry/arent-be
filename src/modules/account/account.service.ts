import { IAccount, IAccountRO } from './account.interface'
import { AccountModel, AccountSnapshotModel } from '@modules/account/account.model'
import { createEtherWallet } from '@utils/wallet'
import { QueryRO } from '@interfaces/query.model'
import { config } from '@config'
import { filter, map, size, split } from 'lodash'
import { MintDto, WithdrawDto } from './account.dto'
import { AccountErrors, AuthErrors } from '@exceptions/custom.error'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { IOperator, IUser } from '@modules/user/user.interface'
import { AccountExtType, AccountType, AdminLogsActions, AdminLogsSections, AccountActionType, MASTER_ACCOUNT_KEY } from '@config/constants'
import AdminLogModel from '@modules/admin_logs/admin_log.model'
import { RateModel } from '@modules/exchange_rate/rate.model'
import { roundUp } from '@utils/utility'
import AccountSnapshotService from '@modules/account/account.snapshot.service'
import IOptions from '@interfaces/options.interface'
import moment from 'moment'

export default class AccountService {
    private static async initAccounts(userKey: string, accountNameSuffix = 'Account') {
        const accounts: any[] = []
        // const primeTokens = config.system.primeTokens.split(',')
        const primeTokens = config.system.primeTokens
        const etherWallet = await createEtherWallet()
        const coinWallets = await PrimeCoinProvider.createCoinWallet(primeTokens, etherWallet.address)
        if (coinWallets.length !== config.system.primeTokens.split(',').length) {
            throw new BizException(
                AccountErrors.account_init_prime_accounts_error,
                new ErrorContext('account.service', 'initAccounts', { primeTokens })
            )
        }

        for (const coinWallet of coinWallets) {
            const accountName = 'Lightlink' ?? `${coinWallet.symbol} ${accountNameSuffix}`
            const account = new AccountModel({
                user_key: userKey,
                name: accountName,
                symbol: coinWallet.symbol,
                type: userKey === MASTER_ACCOUNT_KEY ? AccountType.Master : AccountType.Prime,
                ext_type: AccountExtType.Prime,
                address: etherWallet.address,
                platform: 'system',
                salt: etherWallet.salt,
                key_store: etherWallet.key_store,
                ext_key: coinWallet.key
            })
            accounts.push(account)
        }

        const extTokens = config.system.extTokens
        for (const token of extTokens) {
            const accountName = token.name ?? `${token.symbol} ${accountNameSuffix}`
            if (token.symbol === 'ETH') {
                const account = new AccountModel({
                    user_key: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: userKey === MASTER_ACCOUNT_KEY ? AccountType.Master : AccountType.Ext,
                    ext_type: AccountExtType.Ext,
                    address: etherWallet.address,
                    platform: token.platform,
                    salt: etherWallet.salt,
                    key_store: etherWallet.key_store
                })
                accounts.push(account)
            } else {
                // BTC
                // const btcWallet = await createBtcWallet()
            }
        }

        const erc20Tokens = config.erc20Tokens
        for (const token of erc20Tokens) {
            if (token.symbol) {
                const accountName = token.name ?? `${token.symbol} ${accountNameSuffix}`
                const account = new AccountModel({
                    user_key: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: userKey === MASTER_ACCOUNT_KEY ? AccountType.Master : AccountType.Ext,
                    ext_type: AccountExtType.Ext,
                    address: etherWallet.address,
                    platform: 'ethereum',
                    salt: etherWallet.salt,
                    key_store: etherWallet.key_store,
                    meta_data: {
                        contract: token.contract,
                        decimals: token.decimals
                    }
                })
                accounts.push(account)
            }
        }
        const data = await AccountModel.bulkSave(accounts)
        return data
    }

    protected static async bindingAccountBalance(account: any) {
        if (!account) {
            return account
        }
        const rateData = await RateModel.findOne({ symbol: `${account.symbol}-USDT` }).exec()
        const rate = rateData ? rateData.rate : 1
        let amount = account.amount
        let nonce = 0
        if (account?.ext_type === AccountExtType.Prime) {
            const wallet = await PrimeCoinProvider.getWalletByKey(account.ext_key)
            if (wallet) {
                nonce = wallet.nonce
                account.amount = wallet.amount
                amount = wallet.amount
            }
        } else {
            account.amount_usd = roundUp(account.amount * rate, 2)
        }
        const amount_usd = roundUp(amount * rate, 2)
        const amount_locked_usd = roundUp(account.amount_locked * rate, 2)

        const currency_value_statements = [{ currency: 'USD', symbol: '$', amount: amount_usd, amount_locked: amount_locked_usd }]

        const balance_change_statements = []

        const oneDayAgo = moment().add(-1, 'day').toDate()

        const dailySnapshots = await AccountSnapshotModel.find({ account_key: account.key, created: { $gt: oneDayAgo } })
            .sort({ created: 1 })
            .exec()
        const dailySnapshot = dailySnapshots && dailySnapshots[0]

        if (dailySnapshot) {
            const pre_amount = Number(dailySnapshot.post_amount)
            const pre_amount_usd = roundUp(pre_amount * rate, 2)
            const amount_change = roundUp(amount - pre_amount, 8)
            const amount_usd_change = roundUp(amount_change * rate, 2)
            const percentage_change = pre_amount === 0 ? 0 : roundUp(amount_change / pre_amount, 4)

            balance_change_statements.push({
                period: 'day',
                pre_amount,
                pre_amount_usd,
                amount: Number(amount),
                amount_usd,
                amount_change: amount_change,
                amount_usd_change,
                percentage_change: percentage_change
            })
        } else {
            balance_change_statements.push({
                period: 'day',
                pre_amount: Number(amount),
                pre_amount_usd: amount_usd,
                amount: Number(amount),
                amount_usd,
                amount_change: 0,
                amount_usd_change: 0,
                percentage_change: 0
            })
        }
        const oneWeekAgo = moment().add(-1, 'week').toDate()
        const weeklySnapshots = await AccountSnapshotModel.find({ account_key: account.key, created: { $gt: oneWeekAgo } })
            .sort({ created: 1 })
            .exec()
        const weeklySnapshot = weeklySnapshots && weeklySnapshots[0]

        if (weeklySnapshot) {
            const pre_amount = Number(weeklySnapshot.post_amount)
            const pre_amount_usd = roundUp(pre_amount * rate, 2)
            const amount_change = roundUp(amount - pre_amount, 8)
            const amount_usd_change = roundUp(amount_change * rate, 2)
            const percentage_change = pre_amount === 0 ? 0 : roundUp(amount_change / pre_amount, 4)

            balance_change_statements.push({
                period: 'week',
                pre_amount,
                pre_amount_usd,
                amount: Number(amount),
                amount_usd,
                amount_change,
                amount_usd_change,
                percentage_change: percentage_change
            })
        } else {
            balance_change_statements.push({
                period: 'week',
                pre_amount: Number(amount),
                pre_amount_usd: amount_usd,
                amount: Number(amount),
                amount_usd,
                amount_change: 0,
                amount_usd_change: 0,
                percentage_change: 0
            })
        }

        return { ...account.toJSON(), currency_value_statements, balance_change_statements, nonce }
    }

    protected static mapConditions(fields: { [key: string]: any }) {
        const conditions: { [key: string]: any } = { $and: [{ removed: false }] }

        conditions.$and = filter(
            map(fields, (value, key) => {
                if (!value) {
                    return undefined
                }
                switch (key) {
                    case 'key':
                    case 'user_key':
                    case 'symbol':
                    case 'address': {
                        return {
                            [key]: value
                        }
                    }
                    case 'keys': {
                        return {
                            key: { $in: split(value, ',') }
                        }
                    }
                    case 'symbols': {
                        return {
                            symbol: { $in: split(value, ',') }
                        }
                    }
                    case 'addresses': {
                        return {
                            address: { $in: split(value, ',') }
                        }
                    }
                    case 'type': {
                        return {
                            [key]: value.toUpperCase()
                        }
                    }
                    default: {
                        return undefined // not allow filter by other fields except above
                    }
                }
            }),
            el => !!el
        ).concat(conditions.$and)
        return conditions
    }

    static async getAccountDetailByFields(fields: { [key: string]: any }) {
        const conditions = this.mapConditions(fields)

        const account = await AccountModel.findOne(conditions).select('-key_store -salt').exec()

        return await this.bindingAccountBalance(account)
    }

    static async initUserAccounts(userKey: string) {
        if (userKey === 'MASTER') {
            throw new BizException(AuthErrors.invalid_user_id, new ErrorContext('account.service', 'initUserAccounts', {}))
        }

        return await this.initAccounts(userKey)
    }

    static async getAccountKeyStore(key: string) {
        const account = await AccountModel.findOne({ key }, { _id: 1, key_store: 1, salt: 1 }).exec()
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('account.service', 'getAccountKeyStore', { key }))
        }
        return account
    }

    static async getMasterAccountBriefBySymbol(symbol: string) {
        const account = await AccountModel.findOne({ symbol: symbol, type: AccountType.Master }).select('-key_store -salt').exec()
        return await this.bindingAccountBalance(account)
    }

    static async queryAccounts(fields: { [key: string]: any }, paginate: { page_index: number; page_size: number }) {
        const offset = Math.max(paginate.page_index - 1, 0) * paginate.page_size

        const conditions = this.mapConditions(fields)
        const totalCount = await AccountModel.countDocuments(conditions).exec()
        const items = await AccountModel.find<IAccount>(conditions)
            .select('-key_store -salt')
            .sort({ symbol: -1 })
            .skip(offset)
            .limit(paginate.page_size)
            .exec()

        const data = await Promise.all(
            map(items, async el => {
                return this.bindingAccountBalance(el)
            })
        )
        return new QueryRO<IAccountRO>(totalCount, paginate.page_index, paginate.page_size, data)
    }

    static async withdraw(key: string, params: WithdrawDto, operator: IUser) {
        const account = await AccountService.getAccountKeyStore(key)
        if (account.type === AccountType.Prime) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.service', 'withdraw', { key }))
        }
        if (account.user_key !== operator.key) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.service', 'withdraw', { key }))
        }

        // await AuthService.verifyTwoFactor(operator, params, CodeType.Withdraw)
        // TODO
        throw new Error('Method not implemented.')
    }

    /** MASTER */
    static async initMasterAccounts() {
        const masterAccounts = await AccountModel.find({ type: AccountType.Master, removed: false }).select('-key_store -salt').exec()

        if (size(masterAccounts)) {
            throw new BizException(
                AccountErrors.master_accounts_initialized_error,
                new ErrorContext('account.master.service', 'initMasterAccounts', {})
            )
        }

        return await this.initAccounts(MASTER_ACCOUNT_KEY, 'Master')
    }

    static async mintMasterAccount(key: string, params: MintDto, operator: IOperator, options: IOptions) {
        const account = await AccountModel.findOne({ key }).select('-key_store -salt').exec()
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('account.master.service', 'mintMasterAccount', { key }))
        }
        if (account.type !== AccountType.Master || account.ext_type !== AccountExtType.Prime) {
            throw new BizException(AccountErrors.account_mint_type_error, new ErrorContext('account.master.service', 'mintMasterAccount', { key }))
        }
        const data = await PrimeCoinProvider.mintPrimeCoins({
            key: account.ext_key,
            amount: params.amount,
            notes: params.notes,
            type: params.type || 'MINT'
        })

        await new AdminLogModel({
            operator,
            userKey: account.user_key,
            action: AdminLogsActions.MintMasterAccount,
            section: AdminLogsSections.Account
        }).save()

        await AccountSnapshotService.createAccountSnapshot({
            key: undefined,
            user_key: account.user_key,
            account_key: account.key,
            symbol: account.symbol,
            address: account.address,
            type: AccountActionType.Mint,
            amount: Number(params.amount),
            pre_amount: data.recipient_wallet.pre_balance,
            pre_amount_locked: account.amount_locked,
            post_amount: data.recipient_wallet.post_balance,
            post_amount_locked: account.amount_locked,
            txn: data.key,
            operator: operator,
            options
        })

        return data
    }

    static async getAccountByUserKeyAndSymbol(user_key: string, symbol: string) {
        const account: IAccount | null = await AccountModel.findOne({ user_key, symbol })
        return await this.bindingAccountBalance(account)
    }

    static async lockAmount(key: string, amount: any) {
        const data = await AccountModel.findOneAndUpdate(
            { key: key },
            {
                $inc: { amount_locked: amount },
                $set: { modified: new Date() }
            },
            { new: true }
        )

        return data
    }

    static async unlockAmount(key: string, amount: any) {
        const data = await AccountModel.findOneAndUpdate(
            { key: key },
            {
                $inc: { amount_locked: amount * -1 },
                $set: { modified: new Date() }
            },
            { new: true }
        )
        return data
    }
}
