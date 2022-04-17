import { IAccount, IAccountFilter, AccountType, AccountExtType } from './account.interface'
import AccountModel from './account.model'
import { createEtherWallet } from '../../utils/wallet'
import { QueryRO } from '../../interfaces/qurey.model'
import { config } from '../../config'
import { toUpper, trim } from 'lodash'
import { WithdrawDto } from './account.dto'
import { AccountErrors } from '../../exceptions/custom.error'
import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'
import { createCoinWallet } from '../../providers/coin.provider'

export default class AccountService {
    static async initUserAccounts(userId: string) {
        const accounts: any[] = []
        // const primeTokens = config.system.primeTokens.split(',')
        const primeTokens = config.system.primeTokens
        const etherWallet = await createEtherWallet()
        const coinWallets = await createCoinWallet(primeTokens, etherWallet.address)
        if (coinWallets.length !== config.system.primeTokens.split(',').length) {
            throw new BizException(
                AccountErrors.account_init_prime_accounts_error,
                new ErrorContext('account.service', 'initUserAccounts', { primeTokens })
            )
        }
        for (const coinWallet of coinWallets) {
            const accountName = userId === 'MASTER' ? `${coinWallet.symbol} MASTER` : `${coinWallet.symbol} Account`
            const account = new AccountModel({
                userId: userId,
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
            const accountName = userId === 'MASTER' ? `${token.symbol} MASTER` : `${token.symbol} Account`
            if (token.symbol === 'ETH') {
                const account = new AccountModel({
                    userId: userId,
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
                const accountName = userId === 'MASTER' ? `${token.symbol} MASTER` : `${token.symbol} Account`
                const account = new AccountModel({
                    userId: userId,
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

    static async getAccount(id: string) {
        return await AccountModel.findById(id).select('-keyStore -salt').exec()
    }

    private static async getAccountWithKeyStore(id: string) {
        const account = await AccountModel.findById(id).exec()
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('account.service', 'getAccountWithKeyStore', { id }))
        }
        return account
    }

    static async queryAccounts(params: IAccountFilter) {
        const offset = (params.pageindex - 1) * params.pagesize
        const filter: any = {
            removed: false
        }
        if (params.addresses) {
            const addressList = params.addresses.split(',')
            filter.address = { $in: addressList }
        }
        if (params.symbol) {
            filter.symbol = toUpper(trim(params.symbol))
        }
        const totalCount = await AccountModel.countDocuments(filter).exec()
        const items = await AccountModel.find<IAccount>(filter)
            .select('-keyStore -salt')
            .sort({ symbol: -1 })
            .skip(offset)
            .limit(params.pagesize)
            .exec()
        return new QueryRO<IAccount>(totalCount, params.pageindex, params.pagesize, items)
    }

    static async getUserAccounts(id: any) {
        const items = await AccountModel.find({ userId: id }).select('-keyStore -salt').exec()
        return items
    }

    static async withdraw(id: string, params: WithdrawDto) {
        const account = await AccountService.getAccountWithKeyStore(id)
        if (account.type === AccountExtType.Prime) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.service', 'withdraw', { id }))
        }

        throw new Error('Method not implemented.')
    }
}
