import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  transports: [new transports.Console()],
  format: format.combine(format.label({ label: 'TRANSLUCIA_FEDERATION' }), format.timestamp({ format: 'YYYY-MM-DD HH:mm' }), format.json())
})

type LoggerInfo = {
  functionName: string
  message: string
  data: unknown
}

type LoggerError = {
  functionName: string
  name?: string
  stack?: string
  error_detail?: any
  message: string
  data: unknown
}

export const loggingInfo = (input: LoggerInfo) => {
  logger.info(input)
}

export const loggingError = (input: LoggerError) => {
  logger.error(input)
}
