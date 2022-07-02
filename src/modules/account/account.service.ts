import { AccountExtType, AccountType, IAccount, IAccountFilter } from './account.interface'
import AccountModel from './account.model'
import { createEtherWallet } from '@utils/wallet'
import { QueryRO } from '@interfaces/query.model'
import { config } from '@config'
import { toUpper, trim } from 'lodash'
import { WithdrawDto } from './account.dto'
import { AccountErrors, AuthErrors } from '@exceptions/custom.error'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { PrimeCoinProvider } from '@providers/coin.provider'
import crypto from 'crypto'
import { IUser } from '@modules/user/user.interface'
import VerificationCodeService from '@modules/verification_code/code.service'
import { CodeType } from '@modules/verification_code/code.interface'
import AuthService from '@modules/auth/auth.service'

export default class AccountService {
    static async initUserAccounts(userKey: string) {
        if (userKey === 'MASTER') {
            throw new BizException(AuthErrors.invalid_user_id, new ErrorContext('account.service', 'initUserAccounts', {}))
        }
        const accounts: any[] = []
        // const primeTokens = config.system.primeTokens.split(',')
        const primeTokens = config.system.primeTokens
        const etherWallet = await createEtherWallet()
        const coinWallets = await PrimeCoinProvider.createCoinWallet(primeTokens, etherWallet.address)
        if (coinWallets.length !== config.system.primeTokens.split(',').length) {
            throw new BizException(
                AccountErrors.account_init_prime_accounts_error,
                new ErrorContext('account.service', 'initUserAccounts', { primeTokens })
            )
        }
        for (const coinWallet of coinWallets) {
            const accountName = `${coinWallet.symbol} Account`
            const account = new AccountModel({
                key: crypto.randomBytes(16).toString('hex'),
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
            const accountName = `${token.symbol} Account`
            if (token.symbol === 'ETH') {
                const account = new AccountModel({
                    key: crypto.randomBytes(16).toString('hex'),
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
                const accountName = `${token.symbol} Account`
                const account = new AccountModel({
                    key: crypto.randomBytes(16).toString('hex'),
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

    static async getAccountByKey(key: string) {
        const account = await AccountModel.findOne({ key }).select('-keyStore -salt').exec()
        if (account?.extType === AccountExtType.Prime) {
            const wallet = await PrimeCoinProvider.getWalletByKey(account.extKey)
            account.amount = wallet.amount
            account.nonce = wallet.nonce
        }

        return account
    }

    static async getAccountBySymbol(symbol: string, userKey: string) {
        const account = await AccountModel.findOne({ symbol, userKey }).select('-keyStore -salt').exec()
        if (account?.extType === AccountExtType.Prime) {
            const wallet = await PrimeCoinProvider.getWalletByKey(account.extKey)
            account.amount = wallet.amount
            account.nonce = wallet.nonce
        }

        return account
    }

    static async getAccountBySymbolAndAddress(symbol: string, address: string) {
        const account = await AccountModel.findOne({ symbol: symbol, address: address }).select('-keyStore -salt').exec()
        if (account?.extType === AccountExtType.Prime) {
            const wallet = await PrimeCoinProvider.getWalletByKey(account.extKey)
            account.amount = wallet.amount
            account.nonce = wallet.nonce
        }
        return account
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

    static async getUserAccounts(userKey: any) {
        const items = await AccountModel.find({ userKey: userKey }).select('-keyStore -salt').exec()
        return items
    }

    static async withdraw(key: string, params: WithdrawDto, operator: IUser) {
        const account = await AccountService.getAccountKeyStore(key)
        if (account.type === AccountExtType.Prime) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.service', 'withdraw', { key }))
        }
        if (account.userKey !== operator.key) {
            throw new BizException(AccountErrors.account_withdraw_not_permit_error, new ErrorContext('account.service', 'withdraw', { key }))
        }

        await AuthService.verifyTwoFactor(operator, params, CodeType.Withdraw)
        // TODO
        throw new Error('Method not implemented.')
    }
}
