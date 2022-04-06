export type ModelOptionParams = {
  include_removed?: boolean
  page_size?: number
  page_index?: number
  sort?: { [key: string]: 1 | -1 }
}
