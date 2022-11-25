import IBaseModel from '@interfaces/base.model.interface'
import { MiscReportStatus, MiscReportType } from '@config/constants'
import IFilterModel from '@interfaces/filter.model.interface'

export interface IMiscReport extends IBaseModel {
    type?: MiscReportType
    status?: MiscReportStatus
    description: string
    video?: any
    images?: any
    data?: string
    replay: string
    submitter?: object
    worker?: object
}

export interface IMiscReportFilter extends IFilterModel {
    terms?: string
    submitter?: string
    type?: number
    status?: number
}
