import IBaseModel from '@interfaces/base.model.interface'

export interface IExceptionLog extends IBaseModel {
    key: string
    ip_address: string
    agent: string
    exception: Object
}
