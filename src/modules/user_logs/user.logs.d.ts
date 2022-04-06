declare global {
  declare namespace NAMESPACE_USER_LOGS_V1 {
    export interface IUserLogCreate {
      ip_address: string
      agent: string
      data_before: any
      data_after: any
    }

    export interface IUserLog {
      ip_address: string
      agent: string
      data_before: any
      data_after: any
      created_at: Date
      modified_at: Date
    }
  }
}

export {}
