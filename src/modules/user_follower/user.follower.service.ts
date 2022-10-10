import { IUser } from '@modules/user/user.interface'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { QueryRO } from '@interfaces/query.model'
import UserFollowerModel from '@modules/user_follower/user.follower.model'
import { IUserFollower, IUserFollowerFilter } from '@modules/user_follower/user.follower.interface'
import UserModel from '@modules/user/user.model'
import { AuthErrors } from '@exceptions/custom.error'

export default class UserFollowerService {
    static async followUser(targetKey: string, followerKey: string) {
        const target = await UserModel.findOne({ key: targetKey })
        if (!target) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.follower.service', 'followUser', {}))
        }
        let userFollower = await UserFollowerModel.findOne({ user_key: targetKey, follower_key: followerKey })
        if (userFollower) {
            return { success: true }
        }

        userFollower = new UserFollowerModel()
        userFollower.user_key = targetKey
        userFollower.follower_key = followerKey
        await userFollower.save()
        await UserModel.updateOne({ key: targetKey }, { $inc: { number_of_followers: 1 } }, { upsert: true }).exec()

        return { success: true }
    }

    static async unfollowUser(targetKey: string, followerKey: string) {
        const target = await UserModel.findOne({ key: targetKey })
        if (!target) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('user.follower.service', 'unlikeUser', {}))
        }
        const userFollower = await UserFollowerModel.findOne({ user_key: targetKey, follower_key: followerKey })
        if (userFollower) {
            await userFollower.delete()
            await UserModel.updateOne({ key: targetKey }, { $inc: { number_of_followers: -1 } }, { upsert: true }).exec()
        }
        return { success: true }
    }

    static async getMyFollowUser(userKey: string, followerKey: string) {
        const userFollower = await UserFollowerModel.findOne({ user_key: userKey, follower_key: followerKey })
        return { followed: !!userFollower }
    }

    static async getUserFollowers(params: IUserFollowerFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = { $and: [] }
        const sorting: any = { _id: 1 }
        if (params.follower_key) {
            filter.$and.push({ follower_key: { $eq: params.follower_key } })
        }
        if (params.user_key) {
            filter.$and.push({ user_key: { $eq: params.user_key } })
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await UserFollowerModel.countDocuments(filter)
        const items = await UserFollowerModel.find<IUserFollower>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<IUserFollower>(totalCount, params.page_index, params.page_size, items)
    }
}
