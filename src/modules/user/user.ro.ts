import { IUser } from '@modules/user/user.interface'

export class UserAnalyticRO<T> {
    brief: object
    number_of_followers: number
    number_of_followings: number
    number_of_nft_liked: number
    number_of_nft_created: number

    constructor(user: IUser, number_of_followers: number, number_of_followings: number, number_of_nft_liked: number, number_of_nft_created: number) {
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
            instagram: user.instagram,
            twitter: user.twitter
        }
        this.number_of_followers = number_of_followers
        this.number_of_followings = number_of_followings
        this.number_of_nft_liked = number_of_nft_liked
        this.number_of_nft_created = number_of_nft_created
    }
}
