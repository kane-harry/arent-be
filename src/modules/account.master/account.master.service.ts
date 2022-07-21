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
                user_key: userKey,
                name: accountName,
                symbol: coinWallet.symbol,
                type: AccountType.Master,
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
            const accountName = `${token.symbol} MASTER`
            if (token.symbol === 'ETH') {
                const account = new AccountModel({
                    user_key: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: AccountType.Master,
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
                const accountName = `${token.symbol} MASTER`
                const account = new AccountModel({
                    user_key: userKey,
                    name: accountName,
                    symbol: token.symbol,
                    type: AccountType.Master,
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

    static async getMasterAccounts() {
        const filter: any = {
            type: AccountType.Master,
            removed: false
        }
        const items = await AccountModel.find<IAccount>(filter).select('-key_store -salt').exec()
        for (const account of items) {
            if (account.ext_type === AccountExtType.Prime) {
                const wallet = await PrimeCoinProvider.getWalletByKey(account.ext_type)
                account.amount = wallet.amount
                account.nonce = wallet.nonce
            }
        }

        return items
    }

    static async mintMasterAccount(key: string, params: MintDto, options: { req: AuthenticationRequest }) {
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
                key: options.req.user.key,
                email: options.req.user.email
            },
            user_key: account.user_key,
            action: AdminLogsActions.MintMasterAccount,
            section: AdminLogsSections.Account
        }).save()

        return data
    }
}
