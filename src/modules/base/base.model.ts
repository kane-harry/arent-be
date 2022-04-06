import { CONSTANTS } from '../../configs'
import { ModelOptionParams } from './base.entity'

export class BaseModel {
  protected defaultOptionParams: ModelOptionParams = {
    page_index: CONSTANTS.app.page_index,
    page_size: CONSTANTS.app.page_size,
    include_removed: false,
    sort: { created: -1 }
  }

  protected computePaging(pageSize?: number, pageIndex?: number) {
    const offset = Math.max(Number(pageIndex || 0), 0) * Number(pageSize || 0)
    return {
      offset,
      page_size: Number(pageSize || 0),
      page_index: Number(pageIndex || 0)
    }
  }
}
