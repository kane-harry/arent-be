import ApplicationException from './application.exception'
import IErrorModel from '../interfaces/error.model.interface'

class RequestException extends ApplicationException {
  constructor(error?: IErrorModel) {
    super(error)
  }
}

export default RequestException
