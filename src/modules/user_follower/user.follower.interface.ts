import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface IUserFollower extends IBaseModel {
    user_key: String
    follower_key: String
}

export interface IUserFollowerFilter extends IFilterModel {
    user_key?: String
    follower_key?: String
}
