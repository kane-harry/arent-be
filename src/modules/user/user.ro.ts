import { IUser } from '@modules/user/user.interface'

export class UserAnalyticRO<T> {
    brief: object
    followers: number
    followings: number
    nft_liked: number
    nft_created: number

    constructor(user: IUser, followers: number, followings: number, nft_liked: number, nft_created: number) {
        // @ts-ignore
        this.brief = user.brief
        this.followers = followers
        this.followings = followings
        this.nft_liked = nft_liked
        this.nft_created = nft_created
    }
}
