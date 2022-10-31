import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface IExceptionLog extends IBaseModel {
    key: string
    ip_address: string
    agent: string
    exception: Object
}

export interface IExceptionLogFilter extends IFilterModel {
    terms?: string
}
