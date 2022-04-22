export const CommonErrors = {
    // common errors - start from 1000
    not_implemented: { code: 1002, status: 501, message: 'Not Implemented.' },
    request_validation_error: { code: 1002, status: 422, message: 'The request failed due to a validation error.' },
    internal_server_error: { code: 1003, status: 500, message: 'Internal Server Error' }
}
export const AuthErrors = {
    registration_email_exists_error: { code: 2001, status: 400, message: 'This email is already exists.' },
    registration_email_not_verified_error: { code: 2002, status: 400, message: 'Please verify your email address.' },
    registration_email_already_verified_error: { code: 2003, status: 400, message: 'This email is already verified.' },

    verification_code_duplicate_request_in_minute_error: { code: 2004, status: 400, message: 'Please request verification code 1 minute later.' },
    verification_code_duplicate_request_in_hour_error: { code: 2005, status: 400, message: 'Please request verification code 1 hour later.' },
    verification_code_invalid_error: { code: 2006, status: 400, message: 'Invalid verification code.' },

    credentials_invalid_error: { message: 'Wrong credentials provided.', status: 400, code: 2007 },
    data_confirmation_mismatch_error: { message: 'Data confirmation mismatch.', status: 422, code: 2008 },
    user_not_exists_error: { message: 'User does not exists.', status: 422, code: 2009 }
}

export const AccountErrors = {
    master_accounts_initialized_error: { code: 3001, status: 400, message: 'Master Accounts have been initialized.' },
    account_not_exists_error: { code: 3002, status: 400, message: 'Account not found.' },
    account_mint_type_error: { code: 3003, status: 400, message: 'Account does not support mint amount.' },
    account_init_prime_accounts_error: { code: 3004, status: 400, message: 'Create Prime Accounts error.' },
    account_withdraw_not_permit_error: { code: 3005, status: 400, message: 'This account does not permit withdrawal.' },
    master_account_not_exists_error: { code: 3006, status: 400, message: 'Master Account does not found.' }
}

export const TransactionErrors = {
    sender_account_not_exists_error: { code: 4001, status: 400, message: 'Sender Account does not found.' },
    recipient_account_not_exists_error: { code: 4002, status: 400, message: 'Recipient Account does not found.' },
    sender_insufficient_balance_error: { message: 'Insufficient funds to complete transaction.', code: 4003, status: 400 },
    account_mint_type_error: { code: 4004, status: 400, message: 'Account does not support mint amount.' },
    send_amount_less_than_fee_error: { message: 'Send amount must greater than transfer fee.', code: 4005, status: 400 }
}
