import { config } from 'dotenv'
config()

export type Environments = {
  PORT: number
  SERVER_TIMEOUT: number
  NODE_ENV: string
  IS_PRODUCTION: boolean
  JWT_SECRET: string
  SECURITY_JWT_TOKEN_EXPIRES_IN: string
  MONGO_URL: string
  MONGO_DB_NAME: string

  // redis
  CACHE_PREFIX: string
  REDIS_ENABLED: boolean
  REDIS_URL: string
  CACHE_DEFAULT_EXPIRE_MINUTES: number
}

export const COMMON_ENV = {
  PORT: process.env.PORT,
  SERVER_TIMEOUT: process.env.SERVER_TIMEOUT,
  NODE_ENV: process.env.NODE_ENV,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  JWT_SECRET: process.env.JWT_SECRET,
  SECURITY_JWT_TOKEN_EXPIRES_IN: process.env.SECURITY_JWT_TOKEN_EXPIRES_IN,
  MONGO_URL: process.env.MONGO_URL,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,

  CACHE_PREFIX: process.env.CACHE_PREFIX,
  REDIS_ENABLED: process.env.REDIS_ENABLED,
  REDIS_URL: process.env.REDIS_URL,
  CACHE_DEFAULT_EXPIRE_MINUTES: process.env.CACHE_DEFAULT_EXPIRE_MINUTES
}
