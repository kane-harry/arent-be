import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator'
import { MiscReportStatus, MiscReportType } from '@config/constants'
import { map } from 'lodash'

export class CreateMiscReportDto {
    @IsEnum(MiscReportType, {
        message: `MiscReport Type must be one of ${map(MiscReportType, el => el).join(' ')}`
    })
    public type?: string

    @IsOptional()
    public description: string

    @IsOptional()
    public video?: any

    @IsOptional()
    public images?: any

    @IsOptional()
    public data?: string
}

export class UpdateMiscReportDto {
    @IsOptional()
    @IsEnum(MiscReportType, {
        message: `MiscReport Type must be one of ${map(MiscReportType, el => el).join(' ')}`
    })
    public type?: string

    @IsOptional()
    public description: string

    @IsOptional()
    public video?: any

    @IsOptional()
    public images?: any

    @IsOptional()
    public data?: string
}

export class AdminUpdateMiscReportDto {
    @IsEnum(MiscReportType, {
        message: `MiscReport Type must be one of ${map(MiscReportType, el => el).join(' ')}`
    })
    @IsOptional()
    public type?: string

    @IsEnum(MiscReportStatus, {
        message: `MiscReport Status must be one of ${map(MiscReportStatus, el => el).join(' ')}`
    })
    @IsOptional()
    public status?: string

    @IsOptional()
    public description: string

    @IsOptional()
    public video?: any

    @IsOptional()
    public images?: any

    @IsOptional()
    public data?: string

    @IsOptional()
    public replay?: string

    @IsOptional()
    public worker?: string
}

export class BulkUpdateMiscReportStatusDto {
    @IsNotEmpty()
    @IsEnum(MiscReportStatus, {
        message: `MiscReport Status must be one of ${map(MiscReportStatus, el => el).join(' ')}`
    })
    public status: MiscReportStatus

    @IsNotEmpty()
    public keys: any
}

export class UpdateMiscReportStatusDto {
    @IsNotEmpty()
    @IsEnum(MiscReportStatus, {
        message: `MiscReport Status must be one of ${map(MiscReportStatus, el => el).join(' ')}`
    })
    public status: MiscReportStatus
}

export class BulkDeleteMiscReportDto {
    @IsNotEmpty()
    public keys: any
}
