import STATUS from './status.code'
import { connectMongoDatabase, closeMongoDatabase, DB_TABLES, MODELS } from './mongo'
import { COMMON_ENV } from './env/common'
import { DEVELOPMENT_ENV } from './env/development'
import { PRODUCTION_ENV } from './env/production'

export const CONFIG = {
  ...(COMMON_ENV.IS_PRODUCTION ? PRODUCTION_ENV : DEVELOPMENT_ENV)
}

export const STATUS_CODES = STATUS

export const MONGO = {
  TABLES: DB_TABLES,
  connect: async () => connectMongoDatabase(CONFIG.MONGO_URL, CONFIG.MONGO_DB_NAME),
  close: async () => closeMongoDatabase(),
  MODELS: {
    ...MODELS
  }
}

export * from './roles'
export * from './constants'
export * from './authentication'

// global
declare global {
  type ModulePrefixKey = 'user'
}
