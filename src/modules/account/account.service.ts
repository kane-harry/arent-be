import { IAccount } from './account.interface'
import AccountModel from './account.model'
import { createEtherWallet } from '@utils/wallet'
import { QueryRO } from '@interfaces/query.model'
import { config } from '@config'
import { filter, map, size, split } from 'lodash'
import { MintDto, WithdrawDto } from './account.dto'
import { AccountErrors, AuthErrors } from '@exceptions/custom.error'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { IUser } from '@modules/user/user.interface'
import { AccountExtType, AccountType, AdminLogsActions, AdminLogsSections, MASTER_ACCOUNT_KEY } from '@config/constants'
import AdminLogModel from '@modules/admin_logs/admin_log.model'

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
            const accountName = `${coinWallet.symbol} ${accountNameSuffix}`
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
            const accountName = `${token.symbol} ${accountNameSuffix}`
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
                const accountName = `${token.symbol} ${accountNameSuffix}`
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
        if (account?.ext_type === AccountExtType.Prime) {
            const wallet = await PrimeCoinProvider.getWalletByKey(account.ext_key)
            if (wallet) {
                return {
                    ...(account?.toJSON() || account),
                    amount: wallet.amount,
                    nonce: wallet.nonce
                }
            }
        }

        return account
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
        return new QueryRO<IAccount>(totalCount, paginate.page_index, paginate.page_size, data)
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

    static async mintMasterAccount(key: string, params: MintDto, options: { userKey: string; email: string }) {
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

        // todo : mint log
        await new AdminLogModel({
            operator: {
                key: options.userKey,
                email: options.email
            },
            userKey: account.user_key,
            action: AdminLogsActions.MintMasterAccount,
            section: AdminLogsSections.Account
        }).save()

        return data
    }

    static async getAccountByUserKeyAndSymbol(user_key: string, symbol: string) {
        const account: IAccount | null = await AccountModel.findOne({ user_key, symbol })
        return account
    }
}
