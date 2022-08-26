import { IUser } from '@modules/user/user.interface'

export class BriefUserRO {
    items: Array<{}>
    constructor(items: Array<IUser>) {
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
