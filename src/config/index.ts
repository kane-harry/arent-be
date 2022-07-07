import dotenv from 'dotenv'
import path from 'path'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
dotenv.config()
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
}

export const config = {
    port: Number(process.env.PORT || 3000),

    system: {
        applicationName: String(process.env.APPLICATION_NAME || 'Pellar Federation'),
        defaultQueryPagesize: Number(process.env.DEFAULT_QUERY_PAGE_SIZE || 50),
        mongoUrl: String(process.env.MONGODB_URL),
        primeToken: String(process.env.PRIME_TOKEN || 'LLA'),
        primeTokens: String(process.env.PRIME_TOKENS || 'LLA,LLB'),
        coinServerBaseUrl: String(process.env.COIN_SERVER_BASE_URL || 'http://localhost:3001'),
        coinServerSecrectKey: String(process.env.COIN_SERVER_SECRET_KEY || 'PELLAR-A5B57B456AC7A39E9EE24F353385C'),
        extTokens: [{ symbol: 'ETH', platform: 'ethereum' }],
        secret: String(process.env.SYSTEM_SECRET_KEY || 'PELLAR-7258EE75D288CFD621E9332255186'),
        primeDecimals: 8
    },

    erc20Tokens: [
        {
            symbol: 'USDC',
            contract: '0x347889240b60b63da60bc0f3ed96cbd43f5ab569',
            decimals: 6,
            abi: '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"ADMIN","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"BURNER","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINTER","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"buy","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"sell","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwner","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
        }
    ],
    bep20Tokens: [
        // ....
    ],

    JWT_Access: {
        secret: String(process.env.JWT_ACCESS_SECRET),
        tokenExpiresIn: String(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '30m') // 30 mins
    },

    JWT_Refresh: {
        secret: String(process.env.JWT_REFRESH_SECRET),
        tokenExpiresIn: String(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d') // 7 days
    },

    emailNotification: {
        EMAIL_PARAM_CLIENT_NAME: process.env.EMAIL_PARAM_CLIENT_NAME || 'ABC Inc',
        fromAddress: String(process.env.EMAIL_NOTIFICATION_FROM_ADDRESS || 'tech@pellartech.com'),
        toAddress: String(process.env.EMAIL_NOTIFICATION_TO_ADDRESS || 'tech@pellartech.com'),
        emailSendgridApiKey: String(process.env.EMAIL_SENDGRID_API_KEY)
    },

    EMAIL_TEMPLATES_ROOT_PATH: 'src/templates',

    redis: {
        enabled: Boolean(process.env.REDIS_ENABLED || false),
        redisURL: String(process.env.REDIS_URL || '127.0.0.1'),
        redisPort: Number(process.env.REDIS_PORT || 6379)
    },

    amazonS3: {
        key: String(process.env.S3_AWS_ACCESS_KEY_ID),
        secret: String(process.env.S3_AWS_SECRET_ACCESS_KEY),
        bucket: String(process.env.S3_AWS_BUCKET),
        region: String(process.env.S3_AWS_REGION)
    },

    operations: {
        TASK_EXPORT: 'tasks_export',
        TASK_EXPORT_USER_KYC: 'tasks_export_user_kyc',
        TASK_EXPORT_USER_BANK: 'tasks_export_user_bank',
        TASKS_LIST: 'tasks_list',
        TASKS_LIST_BY_USER: 'list_by_user',
        TASKS_LIST_USER_BANK: 'tasks_list_user_bank',
        TASKS_LIST_USER_KYC: 'tasks_list_user_kyc',
        TASK_APPROVE: 'tasks_approve',
        TASK_APPROVE_USER_BANK: 'task_approve_user_bank',
        TASK_APPROVE_USER_KYC: 'task_approve_user_kyc',
        TASK_REJECT: 'task_reject',
        TASK_REJECT_USER_KYC: 'task_reject_user_kyc',
        TASK_REJECT_USER_BANK: 'task_reject_user_bank',
        TASK_EXPORT_ACCOUNT_WITHADAW: 'tasks_export_account_withdraw',
        USERS_DETAIL: 'users_detail',
        USER_RESET_BANK_VERIFICATION: 'user_rest_bank_verification',
        USER_UPDATE_2FA: 'user_update_2fa',
        LOG_LIST: 'log_list',
        ADMIN_LOG_LIST: 'admin_log_list',
        COIN_TRANSACTION_LIST: 'coin_transaction_list',
        COIN_TRANSACTION_DETAIL: 'coin_transaction_detail',
        TRANSACTION_LIST: 'transaction_list',
        EXPORT_TRANSACTION_LIST: 'export_transaction_list',
        TRANSACTION_DETAIL: 'transaction_detail',
        ACCOUNT_RESET_SYNC_TIME: 'account_reset_sync_time',
        ACCOUNT_DETAIL_LOADED: 'account_detail_loaded',
        USERS_PRESALE: 'users_presale',
        USERS_PRESALE_LIST: 'users_presale_list',
        API_DOCUMENTATION: 'api_docs',
        RESET_TOTP: 'reset_totp',
        TRADES_DETAIL: 'trades_detail',
        USER_LIST_EXPORT: 'users_export',
        VIEW_USER_DETAIL: 'view_user_detail',
        UPDATE_PHONE_STATUS: 'update_phone_status'
    }
}
