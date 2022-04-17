import axios from 'axios'
import { IMintToCoinDto } from 'modules/account/account.interface'

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

export async function createCoinWallet(symbol: string, address: string) {
    const payload = {
        symbol,
        address
    }
    try {
        const resp = await instance.post('/accounts', payload)
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function getAccountByKey(key: string) {
    try {
        const resp = await instance.get(`/accounts/${key}`)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}
export async function getAccountsByAddress(address: string) {
    try {
        const resp = await instance.get(`/accounts/address/${address}`)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}
export async function queryAccounts(filter: any) {
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

export async function send(params: any) {
    try {
        const resp = await instance.post('/transactions', params)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function queryTxns(filter: any) {
    try {
        const resp = await instance.get('/transactions', { params: filter })
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}
export async function getTxnByKey(key: string) {
    try {
        const resp = await instance.get(`/transactions/${key}`)
        // log
        return resp.data.data
    } catch (error) {
        // log
    }
}
