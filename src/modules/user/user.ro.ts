import { IUser } from '@modules/user/user.interface'

export class UserAnalyticRO<T> {
    brief: object
    followers: number
    followings: number
    nft_liked: number
    nft_created: number

    constructor(user: IUser, followers: number, followings: number, nft_liked: number, nft_created: number) {
        this.brief = {
            key: user.key,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: `${user.first_name || ''} ${user.last_name || ''}`,
            chat_name: user.chat_name,
            avatar: user.avatar,
            background: user.background,
            email: user.email,
            bio: user.bio,
            instagram_url: user.instagram_url,
            twitter_url: user.twitter_url
        }
        this.followers = followers
        this.followings = followings
        this.nft_liked = nft_liked
        this.nft_created = nft_created
    }
}
