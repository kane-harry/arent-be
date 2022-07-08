import IBaseModel from '@interfaces/base.model.interface'

export interface IExceptionLog extends IBaseModel {
    key: string
    ipAddress: string
    agent: string
    exception: Object
}
