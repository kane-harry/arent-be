import { loggingError } from '../logging'
import { ErrorKey, ERROR_CONTEXT } from './context'

export { ERROR_CONTEXT }

export class ApplicationError extends Error {
  public message: string
  public readonly name: string
  public readonly function_name: string | undefined
  public readonly error_detail: unknown | undefined
  public readonly stack: string | undefined
  public readonly http_status_code: number
  public readonly app_status_code: number

  constructor(error_key: ErrorKey, options?: { data?: unknown; function_name?: string; error_detail?: unknown }) {
    super(ERROR_CONTEXT[error_key].message)
    this.message = ERROR_CONTEXT[error_key].message
    this.name = ERROR_CONTEXT[error_key].name
    this.http_status_code = ERROR_CONTEXT[error_key].http_status_code
    this.app_status_code = ERROR_CONTEXT[error_key].app_status_code
    this.stack = super.stack
    this.function_name = options?.function_name
    this.error_detail = options?.error_detail

    loggingError({
      data: options?.data,
      message: this.message,
      functionName: this.function_name || '',
      name: this.name,
      stack: super.stack,
      error_detail: options?.error_detail
    })
  }

  setMessage(message: string) {
    this.message = message
  }

  parseJson() {
    return {
      message: this.message,
      name: this.name || undefined,
      http_status_code: this.http_status_code,
      app_status_code: this.app_status_code,
      stack: this.stack,
      error_detail: this.error_detail
    }
  }
}

export class RequestValidationError extends ApplicationError {
  public readonly errors: Record<string, { message: any }>
  constructor(errors: Record<string, { message: any }>) {
    super('request_validation_error')

    this.errors = errors
  }

  parseJson() {
    return {
      ...super.parseJson(),
      errors: this.errors
    }
  }
}
