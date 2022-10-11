import { Response } from 'express'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import UserFollowerService from '@modules/user_follower/user.follower.service'
import { IUserFollowerFilter } from '@modules/user_follower/user.follower.interface'
import { FollowerRO, FollowingRO } from '@modules/user_follower/user.follower.ro'
import UserService from '@modules/user/user.service'

export default class UserFollowerController {
    static async followUser(req: AuthenticationRequest, res: Response) {
        const followerKey = req.user.key
        const { key } = req.params
        const data = await UserFollowerService.followUser(key, followerKey)
        return res.json(data)
    }

    static async unfollowUser(req: AuthenticationRequest, res: Response) {
        const followerKey = req.user.key
        const { key } = req.params
        const data = await UserFollowerService.unfollowUser(key, followerKey)
        return res.json(data)
    }

    static async getMyFollowUsers(req: AuthenticationRequest, res: Response) {
        const followerKey = req.user.key
        const { key } = req.params
        const data = await UserFollowerService.getMyFollowUser(key, followerKey)
        return res.json(data)
    }

    static async getFollowers(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as IUserFollowerFilter
        filter.user_key = key
        const data = await UserFollowerService.getUserFollowers(filter)
        const userKeys = data.items.map(item => item.follower_key)
        const users = await UserService.getBriefByKeys(userKeys)
        return res.json(new FollowerRO(data, users))
    }

    static async getFollowing(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as IUserFollowerFilter
        filter.follower_key = key
        const data = await UserFollowerService.getUserFollowers(filter)
        const userKeys = data.items.map(item => item.user_key)
        const users = await UserService.getBriefByKeys(userKeys)
        return res.json(new FollowingRO(data, users))
    }
}
