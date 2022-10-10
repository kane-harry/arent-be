import { Request, Response } from 'express'
import { AuthenticationRequest } from '@middlewares/request.middleware'
import { MintDto, WithdrawDto } from './account.dto'
import { IAdminAccountsFilter, IUserAccountsFilter } from './account.interface'
import AccountService from './account.service'

export default class AccountController {
    /** MASTER */
    static async initMasterAccounts(req: Request, res: Response) {
        const data = await AccountService.initMasterAccounts()
        return res.json(data)
    }

    static async mintMasterAccount(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const params: MintDto = req.body
        const data = await AccountService.mintMasterAccount(key, params, req.user, req.options)
        return res.json(data)
    }

    static async queryAccounts(req: AuthenticationRequest, res: Response) {
        const { addresses, key, keys, removed, symbol, symbols, user_key, type, page_index, page_size } = req.query as IAdminAccountsFilter
        const data = await AccountService.queryAccounts(
            {
                addresses,
                key,
                keys,
                removed,
                symbol,
                symbols,
                user_key,
                type
            },
            {
                page_index,
                page_size
            }
        )
        return res.json(data)
    }

    /** NORMAL */
    static async getAccountByKey(req: Request, res: Response) {
        const key = req.params.key
        const data = await AccountService.getAccountDetailByFields({ key })
        return res.json(data)
    }

    static async getAccountsByOwner(req: AuthenticationRequest, res: Response) {
        const { addresses, key, keys, symbols, page_index, page_size } = req.query as IUserAccountsFilter
        const data = await AccountService.queryAccounts(
            {
                key,
                addresses,
                keys,
                symbols,
                user_key: req.user.key
            },
            {
                page_index,
                page_size
            }
        )
        return res.json(data)
    }

    static async withdraw(req: AuthenticationRequest, res: Response) {
        const key = req.params.key
        const params: WithdrawDto = req.body
        const data = await AccountService.withdraw(key, params, req.user)
        return res.json(data)
    }
}
