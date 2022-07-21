export class QueryRO<T> {
    total_count: number
    total_pages: number
    page_index: number
    page_size: number
    current_page: number
    has_next_page: boolean
    // items: any;
    items: Array<T>
    constructor(totalCount: number, pageIndex: number, pageSize: number, items: Array<T>) {
        this.total_count = totalCount
        this.page_index = pageIndex
        this.page_size = pageSize
        this.has_next_page = totalCount > pageIndex * pageSize
        this.total_pages = Math.ceil(totalCount / pageSize)
        this.items = items
    }
}
