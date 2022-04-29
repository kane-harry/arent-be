import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export enum UserStatus {
    Normal = 'Normal',
    Suspend = 'Suspend'
}

export type Permission = {
    resource: string // url pattern
    action: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'
}

export interface IUser extends IBaseModel {
    key: string
    firstName: string
    lastName: string
    nickName: string
    email: string
    password: string
    permissions: Array<Permission>
    pin: string
    phone: string
    country: string
    avatar: Object | null
    playerId?: string
    status: UserStatus
    emailVerified: boolean
    twoFactorSecret: string
    twoFactorEnable: string
}

export interface IUserFilter extends IFilterModel {
    symbol?: string
    email?: string // query user's account list -  abc,abe,efg
}
