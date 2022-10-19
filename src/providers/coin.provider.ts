import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { config } from '@config'
import { generate } from 'hmac-auth-express'
import { IMintToCoinDto } from '@modules/account/account.interface'
import { ISendCoinDto, ITransactionFilter } from '@modules/transaction/transaction.interface'
import { CommonErrors } from '@exceptions/custom.error'
import BizException from '@exceptions/biz.exception'
import IErrorModel from '@interfaces/error.model.interface'
import ErrorContext from '@exceptions/error.context'

const _instance = axios.create({
    baseURL: `${config.system.coinServerBaseUrl}/api/v1`,
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
        const secret = config.system.coinServerSecretKey

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
        return response.data
    },
    (error: AxiosError) => {
        // throw new ApplicationException(error?.response?.data as IErrorModel)
        // const { response, request }: { response?: AxiosResponse; request?: XMLHttpRequest; } = error
        // throw new ApplicationException(CommonErrors.internal_server_error, {
        //     className: 'PrimeCoinProvider',
        //     details: String(error?.response?.data?.error),
        //     method: '',
        //     message: String(response?.data?.error?.message || error?.message)
        // })
        return Promise.reject(error.response?.data?.error)
    }
)
export class PrimeCoinProvider {
    private static instance: AxiosInstance = _instance

    public static requestErrorHandler(method: string, error: any) {
        console.log(error)
        const errorModel = CommonErrors.coin_server_request_error as IErrorModel
        errorModel.meta_data = { error: error?.message }
        throw new BizException(errorModel, new ErrorContext('PrimeCoinProvider', method, error?.context?.details))
    }

    public static async coinServerHeartBeat() {
        try {
            const resp = await this.instance.get('/sites/hello')
            return resp.data
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
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('createCoinWallet', error)
        }
    }

    public static async getWalletByKey(key: string) {
        try {
            const resp = await this.instance.get(`/accounts/${key}`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getWalletByKey', error)
        }
    }

    public static async getWalletBySymbolAndAddress(symbol: string, address: string) {
        try {
            const resp = await this.instance.get(`/accounts/${symbol}/address/${address}`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getWalletBySymbolAndAddress', error)
        }
    }

    public static async getWalletNonceBySymbolAndAddress(symbol: string, address: string) {
        try {
            const resp = await this.instance.get(`/accounts/${symbol}/nonce/${address}`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getWalletNonceBySymbolAndAddress', error)
        }
    }

    public static async getWalletsByAddress(address: string) {
        try {
            const resp = await this.instance.get(`/accounts/address/${address}`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getWalletsByAddress', error)
        }
    }

    public static async queryWallets(filter: any) {
        try {
            const resp = await this.instance.get('/accounts', { params: filter })
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('queryWallets', error)
        }
    }

    public static async mintPrimeCoins(params: IMintToCoinDto) {
        try {
            const resp = await this.instance.post('/transactions/mint', params)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('mintPrimeCoins', error)
        }
    }

    public static async sendPrimeCoins(sendData: ISendCoinDto) {
        try {
            const resp = await this.instance.post('/transactions', sendData)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('sendPrimeCoins', error)
        }
    }

    public static async queryPrimeTxns(filter: ITransactionFilter) {
        let path = '/transactions'
        // ?symbol=${filter!.symbol}&keys=${filter!.keys}&owner=${filter!.owner}&page_index=${filter.page_index}&page_size=${filter.page_size}
        const params = []
        for (const [key, value] of Object.entries(filter)) {
            params.push(`${key}=${value}`)
        }
        path = path + '?' + params.join('&')
        try {
            const resp = await this.instance.get(path)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('queryPrimeTxns', error)
        }
    }

    public static async getPrimeTxnByKey(key: string) {
        try {
            const resp = await this.instance.get(`/transactions/${key}`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getPrimeTxnByKey', error)
        }
    }

    public static async getAllPrimeAccountList() {
        try {
            const resp = await this.instance.get('/accounts/prime/list')
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getAllPrimeAccountList', error)
        }
    }

    public static async getAllPrimeTransactionList() {
        try {
            const resp = await this.instance.get('/transactions/prime/list')
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getAllPrimeTransactionList', error)
        }
    }

    public static async getAllPrimeTransactionStats() {
        try {
            const resp = await this.instance.get('/transactions/prime/stats')
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getAllPrimeTransactionStats', error)
        }
    }

    public static async getPrimeAccountList(key: string) {
        try {
            const resp = await this.instance.get(`/accounts/${key}/prime/list`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getPrimeAccountList', error)
        }
    }

    public static async getPrimeTransactionList(key: string) {
        try {
            const resp = await this.instance.get(`/transactions/${key}/prime/list`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getPrimeTransactionList', error)
        }
    }

    public static async getPrimeTransactionStats(key: string) {
        try {
            const resp = await this.instance.get(`/transactions/${key}/prime/stats`)
            return resp.data
        } catch (error) {
            return this.requestErrorHandler('getPrimeTransactionStats', error)
        }
    }
}
