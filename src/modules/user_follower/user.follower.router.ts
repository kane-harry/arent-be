import asyncHandler from '@utils/asyncHandler'
import { requireAuth } from '@utils/authCheck'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import UserFollowerController from '@modules/user_follower/user.follower.controller'

export default class UserFollowerRouter implements ICustomRouter {
    public path = '/users'
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/:key/follow`, requireAuth, asyncHandler(UserFollowerController.followUser))
        this.router.delete(`${this.path}/:key/follow`, requireAuth, asyncHandler(UserFollowerController.unfollowUser))
        this.router.get(`${this.path}/:key/follow`, requireAuth, asyncHandler(UserFollowerController.getMyFollowUsers))

        this.router.get(`${this.path}/:key/followers`, requireAuth, asyncHandler(UserFollowerController.getFollowers))
        this.router.get(`${this.path}/:key/following`, requireAuth, asyncHandler(UserFollowerController.getFollowing))
    }
}
