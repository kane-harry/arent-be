
import { IAccount, IAccountFilter } from './account.interface';
import AccountModel from './account.model';
import { createWallet } from '../../utils/wallet'
import { QueryRO } from '../../interfaces/qurey.model';

export default class AccountService {

    static createAccount = async (params: IAccount) => {
        const wallet = createWallet()

        const mode = new AccountModel({
            symbol: params.symbol,
            publicKey: wallet.public,
            address: wallet.private,
        });
        const savedData = await mode.save();
        return savedData;
    }

    static getAccount = async (address: string) => {
        const data = await AccountModel.findOne({ 'publicKey': address });
        return data;
    }

    static queryAccounts = async (params: IAccountFilter) => {
        let offset = (params.pageindex - 1) * params.pagesize;
        let filter: any = {
            removed: false
        }
        if (params.addresses) {
            const addressList = params.addresses.split(',')
            filter.publicKey = { $in: addressList }
        }
        if (params.symbol) {
            filter.symbol = filter.symbol
        }
        const totalCount = await AccountModel.countDocuments(filter);
        const items = await AccountModel.find<IAccount>(filter).sort({ 'symbol': -1 }).skip(offset).limit(params.pagesize)
        return new QueryRO<IAccount>(totalCount, params.pageindex, params.pagesize, items as [IAccount]);
    }
}