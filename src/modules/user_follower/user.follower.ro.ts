import { QueryRO } from '@interfaces/query.model'
import { IUser } from '@modules/user/user.interface'

export class FollowerRO<T> {
    total_count: number
    total_pages: number
    page_index: number
    page_size: number
    has_next_page: boolean
    items: Array<any>

    constructor(data: QueryRO<any>, users: Array<IUser>) {
        this.total_count = data.total_count
        this.page_index = data.page_index
        this.page_size = data.page_size
        this.has_next_page = data.has_next_page
        this.total_pages = data.total_pages
        this.items = data.items.map(function (item) {
            const user = users.find(element => element.key === item.follower_key)
            return { key: user?.key, chat_name: user?.chat_name, avatar: user?.avatar }
        })
    }
}

export class FollowingRO<T> {
    total_count: number
    total_pages: number
    page_index: number
    page_size: number
    has_next_page: boolean
    items: Array<any>

    constructor(data: QueryRO<any>, users: Array<IUser>) {
        this.total_count = data.total_count
        this.page_index = data.page_index
        this.page_size = data.page_size
        this.has_next_page = data.has_next_page
        this.total_pages = data.total_pages
        this.items = data.items.map(function (item) {
            const user = users.find(element => element.key === item.user_key)
            return { key: user?.key, chat_name: user?.chat_name, avatar: user?.avatar }
        })
    }
}
