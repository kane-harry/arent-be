import { IAccount, IAccountFilter, AccountType } from './account.interface'
import AccountModel from './account.model'
import { createWallet } from '../../utils/wallet'
import { QueryRO } from '../../interfaces/qurey.model'
import { config } from '../../config'
import { toUpper, trim } from 'lodash'
import { WithdrawDto } from './account.dto'
import { AccountErrors } from '../../exceptions/custom.error'
import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'

export default class AccountService {
    static async initUserAccounts(userId: string) {
        const accounts: any[] = []
        const primeTokens = config.system.primeTokens.split(',')
        for (const token of primeTokens) {
            const wallet = await createWallet()
            const accountName = userId === 'MASTER' ? `${token} MASTER` : `${token} Account`
            const account = new AccountModel({
                userId: userId,
                name: accountName,
                symbol: token,
                type: AccountType.Prime,
                address: wallet.address,
                platform: 'system',
                salt: wallet.salt,
                keyStore: wallet.keyStore
            })
            accounts.push(account)
        }

        const extTokens = config.system.extTokens
        for (const token of extTokens) {
            const wallet = await createWallet()
            const accountName = userId === 'MASTER' ? `${token.symbol} MASTER` : `${token.symbol} Account`
            const account = new AccountModel({
                userId: userId,
                name: accountName,
                symbol: token.symbol,
                type: AccountType.Ext,
                address: wallet.address,
                platform: token.platform,
                salt: wallet.salt,
                keyStore: wallet.keyStore
            })
            accounts.push(account)
        }
        const erc20Tokens = config.erc20Tokens
        for (const token of erc20Tokens) {
            if (token.symbol) {
                const wallet = await createWallet()
                const accountName = userId === 'MASTER' ? `${token.symbol} MASTER` : `${token.symbol} Account`
                const account = new AccountModel({
                    userId: userId,
                    name: accountName,
                    symbol: token.symbol,
                    type: AccountType.Ext,
                    address: wallet.address,
                    platform: 'ethereum',
                    salt: wallet.salt,
                    keyStore: wallet.keyStore,
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
        if (account.type === AccountType.Prime) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.service', 'withdraw', { id }))
        }

        throw new Error('Method not implemented.')
    }
}
