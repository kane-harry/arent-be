import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export enum UserStatus {
    Normal = 'Normal',
    Suspend = 'Suspend'
}

export interface IUser extends IBaseModel {
    firstName: string
    lastName: string
    nickName: string
    email: string
    password: string
    roleId: number
    pin: string
    phone: string
    country: string
    avatar: string
    playerId?: string
    status: string
    emailVerified: boolean
}

export interface IUserFilter extends IFilterModel {
    symbol?: string
    email?: string // query user's account list -  abc,abe,efg
}
