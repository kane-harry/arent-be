type ErrorInfo = {
  name: string
  message: string
  http_status_code: number
  app_status_code: number
}

export type ErrorKey =
  | 'internal_server_error'
  | 'url_not_found'
  | 'request_validation_error'
  | 'user_not_exist'
  | 'unauthorized_error'
  | 'action_unauthorized'

export const ERROR_CONTEXT: { [key in ErrorKey]: ErrorInfo } = {
  internal_server_error: {
    name: 'internal_server_error',
    message: 'Internal Server Error',
    http_status_code: 500,
    app_status_code: 0
  },
  url_not_found: {
    name: 'url_not_found',
    message: 'Query for non exists url',
    http_status_code: 404,
    app_status_code: 1
  },
  request_validation_error: {
    name: 'request_validation_error',
    message: 'The request failed due to a validation error.',
    http_status_code: 422,
    app_status_code: 2
  },
  user_not_exist: {
    name: 'user_not_exist',
    message: 'User does not exists',
    http_status_code: 400,
    app_status_code: 3
  },
  unauthorized_error: {
    name: 'unauthorized_error',
    message: 'You are not authorized.',
    http_status_code: 400,
    app_status_code: 4
  },
  action_unauthorized: {
    name: 'action_unauthorized',
    message: 'This action are not allowed.',
    http_status_code: 401,
    app_status_code: 5
  }
}
