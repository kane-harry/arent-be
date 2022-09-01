import { IUser } from '@modules/user/user.interface'

export class BriefUserRO {
    total_count: number
    total_pages: number
    page_index: number
    page_size: number
    current_page: number
    has_next_page: boolean
    items: Array<{}>
    constructor(totalCount: number, pageIndex: number, pageSize: number, items: Array<IUser>) {
        this.total_count = totalCount
        this.page_index = pageIndex
        this.page_size = pageSize
        this.has_next_page = totalCount > pageIndex * pageSize
        this.total_pages = Math.ceil(totalCount / pageSize)
        this.items = items.map((item: IUser) => {
            return {
                key: item.key,
                first_name: item.first_name,
                last_name: item.last_name,
                email: item.email,
                avatar: item.avatar,
                chat_name: item.chat_name
            }
        })
    }
}
