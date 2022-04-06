/**
 * Required External Modules
 */
import { CONFIG, MONGO } from './configs'
import { loggingError, loggingInfo } from './logging'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import http, { STATUS_CODES } from 'http'
import { ApplicationError } from './errors'
import { routers } from './modules'
import passport from 'passport'
import { passportSystem } from './configs/passport'
import { client as redisClient, setData } from './provider/cache'

/**
 * App Variables
 */
if (!CONFIG.PORT) {
  // check requirement env variable
  loggingError({
    functionName: '',
    message: 'Server port not found',
    name: 'config_error',
    data: {}
  })
  process.exit(1)
}
const app = express()

/**
 *  App Configuration
 */
passportSystem()
app.use(helmet()) // middleware
app.use(cors()) // allow cors request
app.use(express.urlencoded({ limit: '15mb', extended: true }))
app.use(express.json({ limit: '15mb' })) // parse request to json

app.use(passport.initialize())
app.set('port', CONFIG.PORT)

// import routers
routers(app)

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new ApplicationError('url_not_found')
  next(error)
})

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errText = err instanceof ApplicationError ? err.parseJson() : new ApplicationError('internal_server_error').parseJson()
  if (CONFIG.IS_PRODUCTION) {
    delete errText.name
    delete errText.stack
    delete errText.error_detail
    errText.message = errText.message === '' ? String(STATUS_CODES[errText.http_status_code] || STATUS_CODES[500]) : errText.message
  }
  return res.status(errText.http_status_code || 500).json(errText)
})

/**
 * Server Activation
 */
const server = http.createServer(app)
server.listen(CONFIG.PORT)
server.on('error', error => {
  loggingError({
    functionName: '',
    message: error.message,
    name: error.name,
    stack: error.stack,
    data: {}
  })
})
server.on('listening', () => {
  loggingInfo({
    functionName: 'app.listen',
    message: `App server is running at port: ${CONFIG.PORT}`,
    data: {}
  })

  MONGO.connect()
})
server.timeout = CONFIG.SERVER_TIMEOUT

/**
 * Other Activation
 */
process.on('uncaughtException', error => {
  loggingError({
    functionName: '',
    message: error.message,
    name: error.name,
    stack: error.stack,
    data: {}
  })
})

process.on('unhandledRejection', (reason: string, p: string) => {
  loggingError({
    functionName: '',
    message: p,
    name: '',
    stack: reason,
    data: {}
  })
})

process.on('SIGTERM', () => {
  server.close()

  if (CONFIG.REDIS_ENABLED && redisClient?.isOpen) {
    redisClient?.disconnect()
  }
})

/**
 * Redis Activation
 */
if (CONFIG.REDIS_ENABLED) {
  redisClient?.on('error', err => {
    loggingError({
      functionName: 'Redis.client',
      error_detail: String(err),
      data: {},
      message: '',
      name: 'redis_error',
      stack: ''
    })
  })

  // ping pong
  setInterval(() => {
    setData('ping', 'pong', 60).then(res => {
      if (!res) {
        loggingError({
          functionName: 'Redis.PingPong',
          error_detail: '',
          data: {},
          message: 'Failing to connect redis client.',
          name: 'redis_error',
          stack: ''
        })
      }
    })
  }, 60 * 1000) // 1 mins
}

/**
 * Init system data
 */
