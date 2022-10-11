export const CommonErrors = {
    // common errors - start from 1000
    unauthorised: { message: 'Unauthorized', code: 10, status: 401 },
    not_implemented: { code: 1002, status: 501, message: 'Not Implemented.' },
    request_validation_error: { code: 1002, status: 422, message: 'The request failed due to a validation error.' },
    internal_server_error: { code: 1003, status: 500, message: 'Internal Server Error' },
    request_forbidden_error: { code: 1004, status: 403, message: 'Forbidden' },
    coin_server_request_error: { code: 1005, status: 400, message: 'The request failed due to a coin server error.' },
    bad_request: { code: 1006, status: 400, message: 'Bad Request.' }
}

export const AuthErrors = {
    registration_info_exists_error: { code: 2001, status: 400, message: 'Info already exists.' },
    registration_email_exists_error: { code: 2002, status: 400, message: 'This email already exists.' },
    registration_phone_exists_error: { code: 2003, status: 400, message: 'This phone number already exists.' },
    registration_email_not_verified_error: { code: 2004, status: 400, message: 'Please verify your email address.' },
    registration_phone_not_verified_error: { code: 2005, status: 400, message: 'Please verify your phone.' },
    registration_email_already_verified_error: { code: 2006, status: 400, message: 'This email is already verified.' },
    registration_chatname_exist_error: { code: 2006, status: 400, message: 'This chatname already exists.' },
    credentials_invalid_error: { message: 'Wrong credentials provided.', status: 400, code: 2007 },
    data_confirmation_mismatch_error: { message: 'Data confirmation mismatch.', status: 422, code: 2008 },
    user_not_exists_error: { message: 'User does not exists.', status: 400, code: 2009 },
    invalid_user_id: { message: 'Invalid User ID.', status: 400, code: 2010 },
    session_expired: { message: 'Session expired.', status: 401, code: 2011 },
    invalid_refresh_token: { message: 'Invalid auth token.', status: 400, code: 2012 },
    token_error: { message: 'Token is not correct', status: 400, code: 2013 },
    invalid_phone: { message: 'Invalid phone.', status: 400, code: 2014 },
    token_require: { message: 'Token is required', status: 400, code: 2016 },
    invalid_pin_code_error: { message: 'Invalid pin code', status: 400, code: 2017 },
    user_locked_error: { message: 'Your account is locked, please contact customer service for help.', code: 2018, status: 400 },
    user_reset_credentials_incorrect_code_error: { message: 'code is incorrect.', code: 2019, status: 400 },
    user_token_setup_error: { message: 'We could not verify your tokens, please try again', code: 2020, status: 400 },
    user_permission_error: { message: 'You do not have permission', code: 2021, status: 400 },
    image_required_error: { code: 2022, status: 400, message: 'Please upload picture.' },
    user_authorize_method_error: { message: 'Unsupport authorize method.', status: 400, code: 2023 },
    user_has_no_email_error: { message: 'You have not set your email address. ', status: 400, code: 2023 },
    user_email_already_verified_error: { message: 'Your email has been verified. ', status: 400, code: 2024 }
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
    deposit_type_not_supported: { code: 4100, status: 400, message: 'Deposit type is not supported' },
    account_deposit_stripe_id_null: { code: 4101, status: 400, message: 'Account Deposit Stripe Id Null' },
    account_is_not_exist: { code: 4102, status: 400, message: 'Account is not existed' },
    deposit_stripe_disabled: { code: 4103, status: 400, message: 'Deposit Stripe Disabled' },
    depositRequiredKycValidation: { code: 4104, status: 400, message: 'Deposit Required Kyc Validation' },
    accountIsNotUSD: { code: 4105, status: 400, message: 'Account Is Not USD' }
}

export const VerificationCodeErrors = {
    verification_code_type_not_supported: { code: 5001, status: 400, message: 'Code type is not supported' },
    verification_code_duplicate_request_in_minute_error: { code: 5002, status: 400, message: 'Please request verification code after 1 minute.' },
    verification_code_duplicate_request_in_hour_error: { code: 5003, status: 400, message: 'Please request verification code after 1 hour.' },
    verification_code_invalid_error: { code: 5004, status: 400, message: 'Invalid verification code.' }
}

export const UpdatePhoneEmailErrors = {
    code_type_not_supported: { code: 5001, status: 400, message: 'Code type is not supported' },
    code_invalid_error: { code: 5004, status: 400, message: 'Invalid verification code.' }
}

export const NftErrors = {
    nft_not_exists_error: { code: 7001, status: 400, message: 'NFT does not exist.' },
    nft_image_error: { code: 7002, status: 400, message: 'Nft Image is required.' },
    nft_image_required_error: { code: 7303, status: 400, message: 'please upload NFT picture.' },
    product_buy_same_owner_error: { code: 7304, status: 400, message: 'You can not buy your own product.' },
    item_not_on_market: { code: 7305, status: 400, message: 'Item not on market' },
    nft_is_not_approved_error: { code: 7306, status: 400, message: 'Nft is not approved.' },
    purchase_auction_nft_error: { code: 7307, status: 400, message: 'Can not buy auction product directly.' },
    purchase_insufficient_funds_error: { code: 7308, status: 400, message: 'Insufficient funds to complete transaction.' },
    nft_auction_start_time_less_than_end_time_error: { message: 'Auction start time should before end time.', code: 1715, status: 400 },
    nft_auction_end_time_less_than_current_time_error: { message: 'Auction end time should in the feature.', code: 1716, status: 400 },
    nft_auction_highest_price_error: { code: 7310, status: 400, message: 'You are already the highest bidder.' },
    nft_auction_closed_error: { code: 7311, status: 400, message: 'Auction closed.' },
    offer_not_exists_error: { code: 7312, status: 400, message: 'Offer not exist.' },
    offer_status_error: { code: 7313, status: 400, message: 'Invalid offer status.' },
    offer_permissions_error: { code: 7314, status: 400, message: 'Wrong permissions on offer' },
    offer_duplicate_request_error: { code: 7315, status: 400, message: 'You have made an offer against this product.' },
    offer_owner_error: { message: 'You can not make offer to your own product.', code: 7316, status: 400 },
    offer_auction_nft_error: { message: 'Can not make offer to an auction product.', code: 7316, status: 400 },
    nft_bidding_amount_less_than_price_error: { message: 'please bid a higher amount than previous amount.', code: 73177, status: 400 },
    nft_updation_status_error: { code: 73178, status: 400, message: 'Your NFT is approved, can not edit it.' }
}

export const CollectionErrors = {
    collection_not_exists_error: { code: 8001, status: 400, message: 'Collection not found.' },
    collection_has_approved_nfts: { code: 8002, status: 400, message: 'Can not delete collection due to there are NFTs in this collection.' },
    image_required_error: { code: 8003, status: 400, message: 'Please upload Collection picture.' }
}

export const UserAuthCodeErrors = {
    verification_code_type_not_supported: { code: 9001, status: 400, message: 'Code type is not supported' },
    verification_code_duplicate_request_in_minute_error: { code: 9002, status: 400, message: 'Please request verification code after 1 minute.' },
    verification_code_duplicate_request_in_hour_error: { code: 9003, status: 400, message: 'Please request verification code after 1 hour.' },
    verification_code_invalid_error: { code: 9004, status: 400, message: 'Invalid verification code.' }
}

export const ArticleErrors = {
    cover_image_required_error: { code: 10001, status: 400, message: 'Cover image is required.' },
    item_not_found_error: { code: 10002, status: 400, message: 'Article does not exist.' }
}

export const CategoryErrors = {
    category_name_exists_error: { code: 11001, status: 400, message: 'The category name already exists.' },
    item_not_found_error: { code: 11002, status: 400, message: 'Category does not exist.' }
}
