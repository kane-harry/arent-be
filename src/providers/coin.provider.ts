import axios from 'axios'
import { IMintToCoinDto } from '../modules/account/account.interface'
import { ISendCoinDto, ISendRawDto, ITransactionFilter } from '../modules/transaction/transaction.interface'

// set global ?
const instance = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Accept: 'application/json'
    },
    withCredentials: true,
    timeout: 30000,
    transformRequest: [
        data => {
            data = JSON.stringify(data)
            return data
        }
    ],
    transformResponse: [
        data => {
            if (typeof data === 'string' && data.startsWith('{')) {
                data = JSON.parse(data)
            }
            return data
        }
    ]
})

export async function createCoinWallet(symbol: string, address: string, raw: boolean = false) {
    const payload = {
        symbol,
        address,
        raw
    }
    try {
        const resp = await instance.post('/accounts', payload)
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function getWalletByKey(key: string) {
    try {
        const resp = await instance.get(`/accounts/${key}`)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function getWalletBySymbolAndAddress(symbol: string, address: string) {
    try {
        const resp = await instance.get(`/accounts/${symbol}/address/${address}`)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function getWalletsByAddress(address: string) {
    try {
        const resp = await instance.get(`/accounts/address/${address}`)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}
export async function queryWallets(filter: any) {
    try {
        const resp = await instance.get('/accounts', { params: filter })
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function mintPrimeCoins(params: IMintToCoinDto) {
    try {
        const resp = await instance.post('/transactions/mint', params)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function sendPrimeCoins(sendData: ISendCoinDto) {
    try {
        const resp = await instance.post('/transactions', sendData)
        // log
        return resp.data.data
    } catch (error) {
        console.log(error)
        // log
    }
}

export async function sendRaw(sendData: ISendRawDto) {
    try {
        const resp = await instance.post('/transactions/sendraw', sendData)
        // log
        return resp.data.data
    } catch (error) {
        console.log(error)
        // log
    }
}

export async function queryPrimeTxns(filter: ITransactionFilter) {
    try {
        const resp = await instance.get('/transactions', { params: filter })
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}
export async function getPrimeTxnByKey(key: string) {
    try {
        const resp = await instance.get(`/transactions/${key}`)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}
