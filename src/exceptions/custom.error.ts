export const CommonErrors = {
    // common errors - start from 1000
    not_implemented: { code: 1002, status: 501, message: 'Not Implemented.' },
    request_validation_error: { code: 1002, status: 422, message: 'The request failed due to a validation error.' },
    internal_server_error: { code: 1003, status: 500, message: 'Internal Server Error' },
    request_forbidden_error: { code: 1004, status: 403, message: 'Forbidden' }
}
export const AuthErrors = {
    registration_info_exists_error: { code: 2001, status: 400, message: 'Info already exists.' },
    registration_email_exists_error: { code: 2002, status: 400, message: 'This email already exists.' },
    registration_phone_exists_error: { code: 2003, status: 400, message: 'This phone number already exists.' },
    registration_email_not_verified_error: { code: 2004, status: 400, message: 'Please verify your email address.' },
    registration_phone_not_verified_error: { code: 2005, status: 400, message: 'Please verify your phone.' },
    registration_email_already_verified_error: { code: 2006, status: 400, message: 'This email is already verified.' },

    verification_code_duplicate_request_in_minute_error: { code: 2004, status: 400, message: 'Please request verification code after 1 minute.' },
    verification_code_duplicate_request_in_hour_error: { code: 2005, status: 400, message: 'Please request verification code after 1 hour.' },
    verification_code_invalid_error: { code: 2006, status: 400, message: 'Invalid verification code.' },

    credentials_invalid_error: { message: 'Wrong credentials provided.', status: 400, code: 2007 },
    data_confirmation_mismatch_error: { message: 'Data confirmation mismatch.', status: 422, code: 2008 },
    user_not_exists_error: { message: 'User does not exists.', status: 422, code: 2009 },
    invalid_user_id: { message: 'Invalid User ID.', status: 400, code: 2010 },
    session_expired: { message: 'Session expired.', status: 401, code: 2011 },
    invalid_refresh_token: { message: 'Invalid auth token.', status: 400, code: 2012 },
    token_error: { message: 'Token is not correct', status: 423, code: 2013 },
    invalid_phone: { message: 'Invalid phone.', status: 424, code: 2014 },
    token_require: { message: 'Token is required', status: 425, code: 2016 }
}

export const AccountErrors = {
    master_accounts_initialized_error: { code: 3001, status: 400, message: 'Master Accounts have been initialized.' },
    account_not_exists_error: { code: 3002, status: 400, message: 'Account not found.' },
    account_mint_type_error: { code: 3003, status: 400, message: 'Account does not support mint amount.' },
    account_init_prime_accounts_error: { code: 3004, status: 400, message: 'Create prime accounts error.' },
    account_withdraw_not_permit_error: { code: 3005, status: 400, message: 'This account does not permit withdrawal.' },
    master_account_not_exists_error: { code: 3006, status: 400, message: 'Master account not found.' }
}

export const TransactionErrors = {
    sender_account_not_exists_error: { code: 4001, status: 400, message: 'Sender account not found.' },
    recipient_account_not_exists_error: { code: 4002, status: 400, message: 'Recipient account not found.' },
    sender_insufficient_balance_error: { message: 'Insufficient funds to complete transaction.', code: 4003, status: 400 },
    account_mint_type_error: { code: 4004, status: 400, message: 'Account does not support mint amount.' },
    send_amount_less_than_fee_error: { message: 'Send amount must greater than transfer fee.', code: 4005, status: 400 },
    account_is_suspend: { code: 4006, status: 400, message: 'Account is suspend.' },
    sender_account_not_own_wallet_error: { code: 4007, status: 400, message: 'Sender account not own wallet.' }
}

export const DepositErrors = {
    deposit_type_not_supported: { code: 4100, status: 400, message: 'Deposit type not supported' },
    account_deposit_stripe_id_null: { code: 4101, status: 400, message: 'Account Deposit Stripe Id Null' },
    account_is_not_exist: { code: 4102, status: 400, message: 'Account is not existed' },
    deposit_stripe_disabled: { code: 4103, status: 400, message: 'Deposit Stripe Disabled' },
    depositRequiredKycValidation: { code: 4104, status: 400, message: 'Deposit Required Kyc Validation' },
    accountIsNotUSD: { code: 4105, status: 400, message: 'Account Is Not USD' }
}
