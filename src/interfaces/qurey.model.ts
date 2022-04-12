export class QueryRO<T> {
  totalCount: number
  totalPages: number
  pageIndex: number
  pageSize: number
  currentPage: number
  hasNextPage: boolean
  // items: any;
  items: [T]
  constructor(totalCount: number, pageIndex: number, pageSize: number, items: [T]) {
    this.totalCount = totalCount
    this.pageIndex = pageIndex
    this.pageSize = pageSize
    this.hasNextPage = totalCount > pageIndex * pageSize
    this.totalPages = Math.ceil(totalCount / pageSize)
    this.items = items
  }
}
