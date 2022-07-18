import { AccountExtType, AccountType, IAccount } from './account.interface'
import AccountModel from './account.model'
import { createEtherWallet } from '@utils/wallet'
import { QueryRO } from '@interfaces/query.model'
import { config } from '@config'
import { filter, map, split } from 'lodash'
import { MintDto, WithdrawDto } from './account.dto'
import { AccountErrors, AuthErrors } from '@exceptions/custom.error'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { IUser } from '@modules/user/user.interface'
import AdminLogModel from '@modules/admin_logs/admin_log.model'
import { AdminLogsActions, AdminLogsSections } from '@modules/admin_logs/admin_log.interface'

export class AccountService {
    protected static async initAccounts(userKey: string, accountNamePrefix = 'Account') {
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
            const accountName = `${coinWallet.symbol} ${accountNamePrefix}`
            const account = new AccountModel({
                userKey: userKey,
                name: accountName,
                symbol: coinWallet.symbol,
                type: AccountType.Prime,
                extType: AccountExtType.Prime,
                address: etherWallet.address,
                platform: 'system',
                salt: etherWallet.salt,
                keyStore: etherWallet.keyStore,
                extKey: coinWallet.key
            })
            accounts.push(account)
        }

        const extTokens = config.system.extTokens
        for (const token of extTokens) {
            const accountName = `${token.symbol} ${accountNamePrefix}`
            if (token.symbol === 'ETH') {
                const account = new AccountModel({
                    userKey: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: AccountType.Ext,
                    extType: AccountExtType.Ext,
                    address: etherWallet.address,
                    platform: token.platform,
                    salt: etherWallet.salt,
                    keyStore: etherWallet.keyStore
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
                const accountName = `${token.symbol} ${accountNamePrefix}`
                const account = new AccountModel({
                    userKey: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: AccountType.Ext,
                    extType: AccountExtType.Ext,
                    address: etherWallet.address,
                    platform: 'ethereum',
                    salt: etherWallet.salt,
                    keyStore: etherWallet.keyStore,
                    metaData: {
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
        if (account?.extType === AccountExtType.Prime) {
            const wallet = await PrimeCoinProvider.getWalletByKey(account.extKey)
            return {
                ...(account?.toJSON() || account),
                amount: wallet.amount,
                nonce: wallet.nonce
            }
        }

        return account
    }

    protected static mapConditions(fields: { [key: string]: any }): { [key: string]: any } {
        return { $and: [{ key: '__lock_implement' }] }
    }

    static async queryAccounts(fields: { [key: string]: any }, paginate: { pageindex: number; pagesize: number }) {
        const offset = Math.max(paginate.pageindex - 1, 0) * paginate.pagesize

        const conditions = this.mapConditions(fields)
        const totalCount = await AccountModel.countDocuments(conditions).exec()
        const items = await AccountModel.find<IAccount>(conditions)
            .select('-keyStore -salt')
            .sort({ symbol: -1 })
            .skip(offset)
            .limit(paginate.pagesize)
            .exec()

        const data = await Promise.all(
            map(items, async el => {
                return await AccountService.bindingAccountBalance(el)
            })
        )
        return new QueryRO<IAccount>(totalCount, paginate.pageindex, paginate.pagesize, data)
    }

    static async getAccountDetailByFields(fields: { [key: string]: any }) {
        const conditions = this.mapConditions(fields)

        const account = await AccountModel.findOne(conditions).select('-keyStore -salt').exec()

        return await this.bindingAccountBalance(account)
    }

    static async getAccountKeyStore(key: string) {
        const account = await AccountModel.findOne({ key }, { _id: 1, keyStore: 1, salt: 1 }).exec()
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('account.service', 'getAccountKeyStore', { key }))
        }
        return account
    }

    static async getMasterAccountBriefBySymbol(symbol: string) {
        const account = await AccountModel.findOne({ symbol: symbol, type: AccountType.Master }).select('-keyStore -salt').exec()
        return account
    }

    static async withdraw(key: string, params: WithdrawDto, operator: IUser) {
        const account = await AccountService.getAccountKeyStore(key)
        if (account.type === AccountExtType.Prime) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.service', 'withdraw', { key }))
        }

        // await AuthService.verifyTwoFactor(operator, params, CodeType.Withdraw)
        // TODO
        throw new Error('Method not implemented.')
    }
}

export class UserAccountService extends AccountService {
    protected static override mapConditions(fields: { [key: string]: any }) {
        const conditions: { [key: string]: any } = { $and: [{ removed: false }] }

        conditions.$and = filter(
            map(fields, (value, key) => {
                switch (key) {
                    case 'userKey':
                    case 'key':
                    case 'symbol':
                    case 'address': {
                        return {
                            [key]: value
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

    static async initUserAccounts(userKey: string) {
        if (userKey === 'MASTER') {
            throw new BizException(AuthErrors.invalid_user_id, new ErrorContext('account.service', 'initUserAccounts', {}))
        }

        return await super.initAccounts(userKey)
    }
}

export class AdminAccountService extends AccountService {
    protected static override mapConditions(fields: { [key: string]: any }) {
        const conditions: { [key: string]: any } = { $and: [{}] }

        conditions.$and = map(fields, (value, key) => {
            switch (key) {
                case 'addresses': {
                    return {
                        address: { $in: split(value, ',') }
                    }
                }
                case 'removed': {
                    if (value === 'true') {
                        return {
                            removed: true
                        }
                    }
                    return {
                        removed: false
                    }
                }
                default:
                    return {
                        [key]: value
                    }
            }
        }).concat(conditions.$and)
        return conditions
    }

    static async initMasterAccounts() {
        const masterAccounts = await super.getAccountDetailByFields({
            type: AccountType.Master,
            removed: false
        })
        if (masterAccounts) {
            throw new BizException(
                AccountErrors.master_accounts_initialized_error,
                new ErrorContext('account.master.service', 'initMasterAccounts', {})
            )
        }

        return await super.initAccounts('MASTER', 'MASTER')
    }

    static async mintMasterAccount(key: string, params: MintDto, options: { userKey: string; email: string }) {
        const account = await AccountModel.findOne({ key }).select('-keyStore -salt').exec()
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('account.master.service', 'mintMasterAccount', { key }))
        }
        if (account.type !== AccountType.Master || account.extType !== AccountExtType.Prime) {
            throw new BizException(AccountErrors.account_mint_type_error, new ErrorContext('account.master.service', 'mintMasterAccount', { key }))
        }
        const data = await PrimeCoinProvider.mintPrimeCoins({
            key: account.extKey,
            amount: params.amount,
            notes: params.notes,
            type: params.type || 'MINT'
        })

        // todo : mint log
        await new AdminLogModel({
            operator: {
                key: options.userKey,
                email: options.email
            },
            userKey: account.userKey,
            action: AdminLogsActions.MintMasterAccount,
            section: AdminLogsSections.Account
        }).save()

        return data
    }
}
