import { AdminUpdateMiscReportDto, CreateMiscReportDto, UpdateMiscReportDto, UpdateMiscReportStatusDto } from './misc.report.dto'
import { MiscReportModel } from './misc.report.model'
import { QueryRO } from '@interfaces/query.model'
import { IMiscReport, IMiscReportFilter } from '@modules/misc_report/misc.report.interface'
import BizException from '@exceptions/biz.exception'
import { AuthErrors, MiscReportErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { isAdmin, roleCan } from '@config/role'
import UserService from '@modules/user/user.service'
import { MiscReportStatus } from '@config/constants'
import { uploadFiles } from '@utils/s3Upload'
import { config } from '@config'
import { IOperator } from '@interfaces/operator.interface'

const { filter } = require('lodash')

export default class MiscReportService {
    static async createMiscReport(params: CreateMiscReportDto, files: any, operator: IOperator) {
        const user = await UserService.getBriefByKey(operator.key)
        if (files) {
            const assets = await uploadFiles(files, 'misc_reports')

            const images = filter(assets, (asset: { fieldname: string }) => {
                return asset.fieldname === 'images'
            })
            const video = filter(assets, (asset: { fieldname: string }) => {
                return asset.fieldname === 'video'
            })
            params.video = video.map(function (el: any) {
                return el.key
            })
            params.images = images.map(function (el: any) {
                return el.key
            })
        }

        const model = new MiscReportModel({
            key: undefined,
            ...params,
            submitter: {
                key: user.key,
                chat_name: user.chat_name
            }
        })
        const miscReport = await model.save()
        return miscReport
    }

    static async queryMiscReports(params: IMiscReportFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = { $and: [{ removed: false }] }
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms, 'i')
            filter.$or = [{ key: reg }, { data: reg }, { description: reg }, { type: reg }, { status: reg }]
        }
        if (params.submitter) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ 'submitter.chat_name': { $eq: params.submitter } })
        }
        if (params.type) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ type: { $eq: params.type } })
        }
        if (params.status) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ status: { $eq: params.status } })
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await MiscReportModel.countDocuments(filter)
        const misc_reports = await MiscReportModel.find<IMiscReport>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO(totalCount, params.page_index, params.page_size, misc_reports)
    }

    static async updateMiscReport(key: string, params: UpdateMiscReportDto, files: any, operator: IOperator) {
        const miscReport = await MiscReportModel.findOne({ key, removed: false })
        if (!miscReport) {
            throw new BizException(MiscReportErrors.misc_report_not_exists_error, new ErrorContext('miscReport.service', 'updateMiscReport', { key }))
        }
        if (!roleCan(operator.role || 0, config.operations.UPDATE_MISC_REPORT_DETAILS) && miscReport.status === MiscReportStatus.Resolved) {
            throw new BizException(
                MiscReportErrors.misc_report_update_status_error,
                new ErrorContext('miscReport.service', 'updateMiscReport', { key })
            )
        }
        if (files) {
            const assets = await uploadFiles(files, 'misc_reports')

            const images = filter(assets, (asset: { fieldname: string }) => {
                return asset.fieldname === 'images'
            })
            const video = filter(assets, (asset: { fieldname: string }) => {
                return asset.fieldname === 'video'
            })
            if (images) {
                params.images = images.map(function (el: any) {
                    return el.Key
                })
            }
            if (video) {
                params.video = video.map(function (el: any) {
                    return el.Key
                })
            }
        }

        if (params.type) {
            miscReport.set('type', params.type, String)
        }
        if (params.description) {
            miscReport.set('description', params.description, String)
        }
        if (params.data) {
            miscReport.set('data', params.data, String)
        }
        if (params.video) {
            miscReport.set('video', params.video, Array)
        }
        if (params.images) {
            miscReport.set('images', params.images, Array)
        }
        const updatedMiscReport = await miscReport.save()
        return updatedMiscReport
    }

    static async adminUpdateMiscReport(key: string, params: AdminUpdateMiscReportDto, files: any, operator: IOperator) {
        const miscReport = await MiscReportModel.findOne({ key, removed: false })
        if (!miscReport) {
            throw new BizException(MiscReportErrors.misc_report_not_exists_error, new ErrorContext('miscReport.service', 'updateMiscReport', { key }))
        }
        if (!roleCan(operator.role || 0, config.operations.UPDATE_MISC_REPORT_DETAILS) && miscReport.status === MiscReportStatus.Resolved) {
            throw new BizException(
                MiscReportErrors.misc_report_update_status_error,
                new ErrorContext('miscReport.service', 'updateMiscReport', { key })
            )
        }
        if (files) {
            const assets = await uploadFiles(files, 'misc_reports')

            const images = filter(assets, (asset: { fieldname: string }) => {
                return asset.fieldname === 'images'
            })
            const video = filter(assets, (asset: { fieldname: string }) => {
                return asset.fieldname === 'video'
            })
            if (images) {
                params.images = images.map(function (el: any) {
                    return el.Key
                })
            }
            if (video) {
                params.video = video.map(function (el: any) {
                    return el.Key
                })
            }
        }

        if (params.type) {
            miscReport.set('type', params.type, String)
        }
        if (params.description) {
            miscReport.set('description', params.description, String)
        }
        if (params.data) {
            miscReport.set('data', params.data, String)
        }
        if (params.video) {
            miscReport.set('video', params.video, Array)
        }
        if (params.images) {
            miscReport.set('images', params.images, Array)
        }
        if (params.replay) {
            miscReport.set('replay', params.replay, String)
        }
        const updatedMiscReport = await miscReport.save()
        return updatedMiscReport
    }

    static async updateMiscReportStatus(key: string, updateMiscReportStatusDto: UpdateMiscReportStatusDto, operator: IOperator) {
        const miscReport = await MiscReportModel.findOne({ key, removed: false })
        if (!miscReport) {
            throw new BizException(
                MiscReportErrors.misc_report_not_exists_error,
                new ErrorContext('miscReport.service', 'updateMiscReportStatus', { key })
            )
        }
        miscReport.set('status', updateMiscReportStatusDto.status, String)
        miscReport.set('worker', { key: operator.key, chat_name: operator.chat_name }, Object)
        const updatedMiscReport = await miscReport.save()
        return updatedMiscReport
    }

    static async deleteMiscReport(key: string, operator: IOperator) {
        const miscReport = await MiscReportModel.findOne({ key, removed: false })
        if (!miscReport) {
            throw new BizException(
                MiscReportErrors.misc_report_not_exists_error,
                new ErrorContext('miscReport.controller', 'deleteMiscReport', { key })
            )
        }
        // @ts-ignore
        if (!isAdmin(operator?.role) && operator.key !== miscReport.submitter?.chat_name) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('miscReport.controller', 'deleteMiscReport', { key }))
        }
        miscReport.set('removed', true, Boolean)
        await miscReport.save()

        return { success: true }
    }

    static async getMiscReportDetail(key: string) {
        const miscReport = await MiscReportModel.findOne({ key, removed: false }).exec()
        if (!miscReport) {
            throw new BizException(
                MiscReportErrors.misc_report_not_exists_error,
                new ErrorContext('miscReport.controller', 'getMiscReportDetail', { key })
            )
        }
        return miscReport
    }
}
