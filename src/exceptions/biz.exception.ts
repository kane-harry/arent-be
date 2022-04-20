import ErrorContext from './error.context'
import ApplicationException from './application.exception'
import IErrorModel from '@interfaces/error.model.interface'

class BizException extends ApplicationException {
    constructor(error?: IErrorModel, errorContext?: ErrorContext) {
        super(error, errorContext)
    }
}

export default BizException
