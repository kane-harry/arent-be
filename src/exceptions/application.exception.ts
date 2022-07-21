import ErrorContext from './error.context'
import { STATUS_CODES } from './status.code'
import IErrorModel from '@interfaces/error.model.interface'

class ApplicationException extends Error {
    status: number
    code: number
    error_context?: ErrorContext
    message: string
    meta_data?: string

    constructor(error?: IErrorModel, errorContext?: ErrorContext) {
        super(error?.message)
        Error.captureStackTrace(this, this.constructor)
        Object.setPrototypeOf(this, new.target.prototype)
        this.name = this.constructor.name
        this.status = error?.status || 500
        this.code = error?.code || 0
        this.message = errorContext?.message || error?.message || STATUS_CODES[500]
        this.meta_data = error?.meta_data
        this.error_context = errorContext
    }
}
export default ApplicationException
