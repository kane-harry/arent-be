export const CommonErrors = {
    // common errors - start from 1000
    not_implemented: { code: 1002, status: 501, message: 'Not Implemented.' },
    request_validation_error: { code: 2002, status: 422, message: 'The request failed due to a validation error.' }
}
export const AuthErrors = {
    registration_email_exists_error: { code: 1001, status: 400, message: 'This email is already exists.' },
    registration_email_not_verified_error: { code: 1002, status: 400, message: 'Please verify your email address.' },
    registration_email_already_verified_error: { code: 1003, status: 400, message: 'This email is already verified.' },

    verification_code_duplicate_request_in_minute_error: { code: 1004, status: 400, message: 'Please request verification code 1 minute later.' },
    verification_code_duplicate_request_in_hour_error: { code: 1005, status: 400, message: 'Please request verification code 1 hour later.' },
    verification_code_invalid_error: { code: 1006, status: 400, message: 'Invalid verification code.' }
}
