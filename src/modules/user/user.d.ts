import { Roles } from '../../configs'

declare global {
  declare namespace NAMESPACE_USER_V1 {
    export type ConnectWalletParams = {
      wallet_address: string
    }

    export type Avatar = {
      sm?: string
      md?: string
      lg?: string
      original: string | null
    }

    export type CreateUserParams = {
      key?: string
      first_name?: string
      last_name?: string
      username: string
      wallet_address: string
      nonce_text: string
      phone?: string
      email?: string
      avatar?: Avatar
      role: Roles
      removed: boolean
      token: string | null
      token_version?: number
      bio?: string
      social_twitter?: string
      social_instagram?: string
      social_site?: string
      description?: string
    }

    export interface IUser {
      key: string
      first_name?: string
      last_name?: string
      username: string
      wallet_address: string
      nonce_text: string
      nonce_text_created?: Date
      phone?: string
      email?: string
      avatar?: Avatar
      role: Roles
      removed: boolean
      token: string | null
      token_version?: number
      bio?: string
      social_twitter?: string
      social_instagram?: string
      social_site?: string
      description?: string
      created_at: Date
      modified_at: Date
    }
  }
}

export {}
