export class QueryRO<T> {
    totalCount: number
    totalPages: number
    pageIndex: number
    pageSize: number
    currentPage: number
    hasNextPage: boolean
    // items: any;
    items: Array<T>
    constructor(totalCount: number, pageIndex: number, pageSize: number, items: Array<T>) {
        this.totalCount = totalCount
        this.pageIndex = pageIndex
        this.pageSize = pageSize
        this.hasNextPage = totalCount > pageIndex * pageSize
        this.totalPages = Math.ceil(totalCount / pageSize)
        this.items = items
    }
}
