import ErrorContext from './error.context'
import { STATUS_CODES } from './status.code'
import IErrorModel from '@interfaces/error.model.interface'

class ApplicationException extends Error {
    status: number
    code: number
    errorContext?: ErrorContext
    message: string
    metaData?: string

    constructor(error?: IErrorModel, errorContext?: ErrorContext) {
        super(error?.message)
        Error.captureStackTrace(this, this.constructor)
        Object.setPrototypeOf(this, new.target.prototype)
        this.name = this.constructor.name
        this.status = error?.status || 500
        this.code = error?.code || 0
        this.message = `${error?.message || STATUS_CODES[500]}. Details: ${errorContext?.details ? JSON.stringify(errorContext.details) : ''}`
        this.metaData = error?.metaData
        this.errorContext = errorContext
    }
}
export default ApplicationException
