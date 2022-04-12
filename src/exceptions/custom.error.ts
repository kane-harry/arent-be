export const CommmonErrors = {
    // common errors - start from 1000
    not_implemented: { code: 1002, status: 501, message: 'Not Implemented.' },
    request_validation_error: { code: 2002, status: 422, message: 'The request failed due to a validation error.' }
}
export const AuthErrors = {
    registration_email_exists_error: { code: 1001, status: 401, message: 'This email is already exists.' }
}
