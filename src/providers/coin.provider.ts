import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@config'
import { generate } from 'hmac-auth-express'
import { IMintToCoinDto } from '@modules/account/account.interface'
import { ISendCoinDto, ISendRawDto, ITransactionFilter } from '@modules/transaction/transaction.interface'
import ApplicationException from '@exceptions/application.exception'
import { CommonErrors } from '@exceptions/custom.error'

// TODO  catch coin errors using interceptors ?

const _instance = axios.create({
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
_instance.interceptors.request.use(
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
_instance.interceptors.response.use(
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
export class PrimeCoinProvider {
    private static instance: AxiosInstance = _instance

    public static requestErrorHandler(method: string, error: any) {
        console.log(error)
        throw new ApplicationException(CommonErrors.internal_server_error, {
            className: 'PrimeCoinProvider',
            details: String(error),
            method
        })
    }

    public static async coinServerHeartBeat() {
        try {
            const resp = await this.instance.get('/sites/hello')
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('coinServerHeartBeat', error)
        }
    }

    public static async createCoinWallet(symbol: string, address: string, raw: boolean = false) {
        const payload = {
            symbol,
            address,
            raw
        }
        try {
            const resp = await this.instance.post('/accounts', payload)
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('createCoinWallet', error)
        }
    }

    public static async getWalletByKey(key: string) {
        try {
            const resp = await this.instance.get(`/accounts/${key}`)
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('getWalletByKey', error)
        }
    }

    public static async getWalletBySymbolAndAddress(symbol: string, address: string) {
        try {
            const resp = await this.instance.get(`/accounts/${symbol}/address/${address}`)
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('getWalletBySymbolAndAddress', error)
        }
    }

    public static async getWalletsByAddress(address: string) {
        try {
            const resp = await this.instance.get(`/accounts/address/${address}`)
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('getWalletsByAddress', error)
        }
    }

    public static async queryWallets(filter: any) {
        try {
            const resp = await this.instance.get('/accounts', { params: filter })
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('queryWallets', error)
        }
    }

    public static async mintPrimeCoins(params: IMintToCoinDto) {
        try {
            const resp = await this.instance.post('/transactions/mint', params)
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('mintPrimeCoins', error)
        }
    }

    public static async sendPrimeCoins(sendData: ISendCoinDto) {
        try {
            const resp = await this.instance.post('/transactions', sendData)
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('sendPrimeCoins', error)
        }
    }

    public static async sendRaw(sendData: ISendRawDto) {
        try {
            const resp = await this.instance.post('/transactions/sendraw', sendData)
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('sendRaw', error)
        }
    }

    public static async queryPrimeTxns(filter: ITransactionFilter) {
        let path = '/transactions'
        // ?symbol=${filter!.symbol}&keys=${filter!.keys}&owner=${filter!.owner}&pageindex=${filter.pageindex}&pagesize=${filter.pagesize}
        const params = []
        for (const [key, value] of Object.entries(filter)) {
            params.push(`${key}=${value}`)
        }
        path = path + '?' + params.join('&')
        try {
            const resp = await this.instance.get(path)
            // log
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('queryPrimeTxns', error)
        }
    }

    public static async getPrimeTxnByKey(key: string) {
        try {
            const resp = await this.instance.get(`/transactions/${key}`)
            // log
            return resp.data.data
        } catch (error) {
            return this.requestErrorHandler('getPrimeTxnByKey', error)
        }
    }
}
