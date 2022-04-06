import { snakeCase } from 'lodash'
import moment from 'moment'

export const getUnixTimestamp = () => {
  return moment().unix()
}

export const toPagingData = (params: { total_count: number; page_index: number; page_size: number; items: any[] }) => {
  const { total_count, page_index, page_size, items } = params
  const has_next_page = total_count > page_size * page_index
  const total_pages = Math.ceil(total_count / page_size)
  return { total_count, total_pages, has_next_page, current_page: page_index, item_count: items.length, items: items }
}

export const stringifyNavKey = (title: string) => {
  return snakeCase(title)
}
