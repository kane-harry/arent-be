import { connect, Mongoose, model, Schema, models } from 'mongoose'
import { loggingError, loggingInfo } from '../logging'
import { userSchema } from './schema/user'
import { userLogSchema } from './schema/user.log'

let dbCached: Mongoose | null
export const connectMongoDatabase = async (mongoUrl: string, dbName: string): Promise<Mongoose> => {
  if (dbCached) {
    return dbCached
  }

  try {
    dbCached = await connect(mongoUrl, {
      sslValidate: true,
      dbName
    })
    loggingInfo({
      data: {},
      functionName: 'mongo.connect',
      message: 'Mongo db connected ' // ${mongoUrl}
    })
    return dbCached
  } catch (err) {
    loggingError({
      data: {},
      functionName: 'mongo.connect',
      message: 'Receiving error when connecting database',
      error_detail: String(err),
      name: 'connect_db_error'
    })
    throw new Error()
  }
}

export const closeMongoDatabase = async () => {
  if (dbCached && dbCached.connection) {
    await dbCached.connection.close()
  }
  dbCached = null
}

export const DB_TABLES = {
  users: 'users',
  user_logs: 'user_logs'
}

export const MODELS = {
  USER: models.user || model(DB_TABLES.users, new Schema<NAMESPACE_USER_V1.IUser>(userSchema)),
  USER_LOG: models.user_logs || model(DB_TABLES.user_logs, new Schema<NAMESPACE_USER_LOGS_V1.IUserLog>(userLogSchema))
}
