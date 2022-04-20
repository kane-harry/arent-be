import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config'
import { generate } from 'hmac-auth-express'
import { IMintToCoinDto } from '../modules/account/account.interface'
import { ISendCoinDto, ISendRawDto, ITransactionFilter } from '../modules/transaction/transaction.interface'

// global ?
const instance = axios.create({
    baseURL: config.system.coinServerBaseUrl,
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
instance.interceptors.request.use(
    (axiosConfig: AxiosRequestConfig) => {
        const time = Date.now().toString()
        const httpMethod = axiosConfig.method!.toUpperCase()
        const requestPath = axiosConfig.url!
        const secret = config.system.coinServerSecrectKey

        let digest = generate(secret, 'sha256', time, httpMethod, requestPath, axiosConfig.data).digest('hex')
        if (httpMethod === 'GET') {
            digest = generate(secret, 'sha256', time, httpMethod, requestPath, {}).digest('hex')
        }
        const hmac = `HMAC ${time}:${digest}`

        axiosConfig.headers!.Authorization = `${hmac}`
        return axiosConfig
    },
    err => {
        return Promise.reject(err)
    }
)
instance.interceptors.response.use(
    (response: AxiosResponse) => {
        const status = response.status
        if (status !== 200) {
            // TODO:
        }
        return response
    },
    function (error) {
        return Promise.reject(error)
    }
)
// TODO  catch coin errors using interceptors ?

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
        console.log(error)
        // log
    }
}

export async function getWalletByKey(key: string) {
    try {
        const resp = await instance.get(`/accounts/${key}`)
        return resp.data.data
    } catch (error) {
        console.log(error)
        // log
    }
}

export async function getWalletBySymbolAndAddress(symbol: string, address: string) {
    try {
        const resp = await instance.get(`/accounts/${symbol}/address/${address}`)
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function getWalletsByAddress(address: string) {
    try {
        const resp = await instance.get(`/accounts/address/${address}`)
        return resp.data.data
    } catch (error) {
        // log
    }
}
export async function queryWallets(filter: any) {
    try {
        const resp = await instance.get('/accounts', { params: filter })
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function mintPrimeCoins(params: IMintToCoinDto) {
    try {
        const resp = await instance.post('/transactions/mint', params)
        return resp.data.data
    } catch (error) {
        // log
    }
}

export async function sendPrimeCoins(sendData: ISendCoinDto) {
    try {
        const resp = await instance.post('/transactions', sendData)
        return resp.data.data
    } catch (error) {
        console.log(error)
        // log
    }
}

export async function sendRaw(sendData: ISendRawDto) {
    try {
        const resp = await instance.post('/transactions/sendraw', sendData)
        return resp.data.data
    } catch (error) {
        console.log(error)
        // log
    }
}

export async function queryPrimeTxns(filter: ITransactionFilter) {
    let path = '/transactions'
    // ?symbol=${filter!.symbol}&keys=${filter!.keys}&owner=${filter!.owner}&pageindex=${filter.pageindex}&pagesize=${filter.pagesize}
    const params = []
    for (const [key, value] of Object.entries(filter)) {
        params.push(`${key}=${value}`)
    }
    path = path + '?' + params.join('&')
    try {
        const resp = await instance.get(path)
        // log
        return resp.data.data
    } catch (error) {
        console.log(error)
        // log
    }
}
export async function getPrimeTxnByKey(key: string) {
    try {
        const resp = await instance.get(`/transactions/${key}`)
        // log
        return resp.data.data
    } catch (error) {
        console.log(error)
        // log
    }
}
