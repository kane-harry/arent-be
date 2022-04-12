import ErrorContext from './error.context'
import IErrorModel from '../interfaces/error.model.interface'
const httpStatus = require('./status.code')

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
        this.message = error?.message || httpStatus.STATUS_CODES[500]
        this.metaData = error?.metaData
        this.errorContext = errorContext
    }
}
export default ApplicationException
