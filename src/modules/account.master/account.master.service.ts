import crypto from 'crypto'
import { IAccount, AccountType, AccountExtType } from '@modules/account/account.interface'
import AccountModel from '@modules/account/account.model'
import { createEtherWallet } from '@utils/wallet'
import { config } from '@config'
import { AccountErrors } from '@exceptions/custom.error'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { MintDto } from '@modules/account/account.dto'
import AdminLogModel from '@modules/admin_logs/admin_log.model'
import { AdminLogsActions, AdminLogsSections } from '@modules/admin_logs/admin_log.interface'
import { AuthenticationRequest } from '@middlewares/request.middleware'

export default class AccountMasterService {
    static async initMasterAccounts() {
        const masterAccounts = await AccountMasterService.getMasterAccounts()
        if (masterAccounts.length > 0) {
            throw new BizException(
                AccountErrors.master_accounts_initialized_error,
                new ErrorContext('account.master.service', 'initMasterAccounts', {})
            )
        }

        const accounts: any[] = []
        const userKey = 'MASTER'
        const primeTokens = config.system.primeTokens
        const etherWallet = await createEtherWallet()
        const coinWallets = await PrimeCoinProvider.createCoinWallet(primeTokens, etherWallet.address)
        for (const coinWallet of coinWallets) {
            const accountName = `${coinWallet.symbol} MASTER`
            const account = new AccountModel({
                key: crypto.randomBytes(16).toString('hex'),
                userKey: userKey,
                name: accountName,
                symbol: coinWallet.symbol,
                type: AccountType.Master,
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
            const accountName = `${token.symbol} MASTER`
            if (token.symbol === 'ETH') {
                const account = new AccountModel({
                    key: crypto.randomBytes(16).toString('hex'),
                    userKey: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: AccountType.Master,
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
                const accountName = `${token.symbol} MASTER`
                const account = new AccountModel({
                    key: crypto.randomBytes(16).toString('hex'),
                    userKey: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: AccountType.Master,
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

    static async getMasterAccounts() {
        const filter: any = {
            type: AccountType.Master,
            removed: false
        }
        const items = await AccountModel.find<IAccount>(filter).select('-keyStore -salt').exec()
        for (const account of items) {
            if (account.extType === AccountExtType.Prime) {
                const wallet = await PrimeCoinProvider.getWalletByKey(account.extKey)
                account.amount = wallet.amount
                account.nonce = wallet.nonce
            }
        }

        return items
    }

    static async mintMasterAccount(key: string, params: MintDto, options: { req: AuthenticationRequest }) {
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
            key: crypto.randomBytes(16).toString('hex'),
            operator: {
                key: options.req.user.key,
                email: options.req.user.email
            },
            userKey: account.userKey,
            action: AdminLogsActions.MintMasterAccount,
            section: AdminLogsSections.Account
        }).save()

        return data
    }
}
