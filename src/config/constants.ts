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

export enum NftHistoryActions {
    Create = 'Create',
    Update = 'Update',
    Delete = 'Delete',
    UpdateStatus = 'UpdateStatus',
    OnMarket = 'OnMarket',
    OffMarket = 'OffMarket',
    Purchase = 'Purchase'
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
    prime_transfer_fee: 0.1,
    nft_commission_fee_rate: 0.05
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
    { maxSize: 1280, id: 'large' },
    { maxSize: 600, id: 'normal' },
    { maxSize: 300, id: 'small' }
]

export const USER_AVATAR_SIZES = [
    { maxSize: 400, id: 'normal' },
    { maxSize: 200, id: 'small' }
]

export enum NftType {
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155'
}

export enum NftOnwerShipType {
    Mint = 'Mint',
    Purchase = 'Purchase',
    Transfer = 'Transfer'
}

export const COLLECTION_LOGO_SIZES = [
    { maxSize: 400, id: 'normal' },
    { maxSize: 200, id: 'small' }
]

export const COLLECTION_BACKGROUND_SIZES = [
    { maxSize: 800, id: 'normal' },
    { maxSize: 600, id: 'small' }
]
