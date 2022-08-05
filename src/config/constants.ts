export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    PhoneRegistration = 'PhoneRegistration',
    EmailUpdate = 'EmailUpdate',
    PhoneUpdate = 'PhoneUpdate',
    ForgotPassword = 'ForgotPassword',
    ForgotPin = 'ForgotPin',
    Login = 'Login',
    Withdraw = 'Withdraw',
    Trade = 'Trade',
    Security = 'Security'
}

export enum UserStatus {
    Normal = 'Normal',
    Locked = 'Locked',
    Suspend = 'Suspend'
}

export enum UserHistoryActions {
    UpdateProfile = 'UpdateProfile',
    Register = 'Register',
    UpdateEmail = 'UpdateEmail',
    UpdatePhone = 'UpdatePhone',
    ResetPassword = 'ResetPassword',
    ResetPin = 'ResetPin',
    UpdateSecurity = 'UpdateSecurity',
    SetupCredentials = 'SetupCredentials',
    SetupTOTP = 'SetupTOTP'
}

export enum SecurityActions {
    Login = 'Login'
}

export enum FeeMode {
    Inclusive = 'inclusive',
    Exclusive = 'exclusive'
}

export const DEFAULT_SETTING = {
    registration_require_email_verified: true,
    registration_require_phone_verified: false,
    login_require_mfa: true,
    withdraw_require_mfa: true,
    prime_transfer_fee: 0.1
}

export const SETTINGS_TYPE = {
    global_federation_settings: 'GLOBAL_FEDERATION_SETTINGS'
}

export enum AdminLogsActions {
    UpdateUser = 'UpdateUser',
    LockUser = 'LockUser',
    UnlockUser = 'UnlockUser',
    RemoveUser = 'RemoveUser',
    ResetTOPTUser = 'ResetTOPTUser',
    UpdateRoleUser = 'UpdateRoleUser',
    MintMasterAccount = 'MintMasterAccount',
    ResetCredentialsUser = 'ResetCredentialsUser'
}

export enum AdminLogsSections {
    User = 'User',
    Transaction = 'Transaction',
    Account = 'Account'
}

export enum AuthTokenType {
    RefreshToken = 'RefreshToken'
}

export enum MFAType {
    TOTP = 'TOTP',
    PIN = 'PIN',
    SMS = 'SMS',
    EMAIL = 'EMAIL'
}

export enum AccountType {
    Master = 'MASTER',
    Prime = 'PRIME',
    Ext = 'EXT'
}

export enum AccountExtType {
    Prime = 'PRIME',
    Ext = 'EXT'
}

export const MASTER_ACCOUNT_KEY = 'MASTER'

export enum NftStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected'
}

export const NFT_IMAGE_SIZES = [
    { maxSize: 1280, id: 'lg' },
    { maxSize: 600, id: 'sm' },
    { maxSize: 300, id: 'sm' }
]

export const USER_IMAGE_SIZES = [
    { maxSize: 1280, id: 'lg' },
    { maxSize: 600, id: 'sm' },
    { maxSize: 80, id: 'mini' }
]
