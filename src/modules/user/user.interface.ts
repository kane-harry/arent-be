import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export enum UserStatus {
    Normal = 'Normal',
    Locked = 'Locked',
    Suspend = 'Suspend'
}

export interface IUser extends IBaseModel {
    key: string
    firstName: string
    lastName: string
    chatName: string
    email: string
    password: string
    pin: string
    phone: string
    country: string
    avatar: Object | null
    playerId?: string
    status: UserStatus
    emailVerified: boolean
    phoneVerified: boolean
    kycVerified: boolean
    role: number | 0
    loginCount: number | 0
    lockedTimestamp: number | 0
    mfaSettings: Object | any
    changePasswordNextLogin: boolean
    changePasswordNextLoginTimestamp: number
    changePasswordNextLoginCode: string
    changePasswordNextLoginAttempts: number
    totpTempSecret: string
    totpSecret: string
    totpSetup: boolean
    tokenVersion: number
}

export interface IUserQueryFilter extends IFilterModel {
    type: string
    status: string
    terms: string
    datefrom: string
    dateto: string
}
