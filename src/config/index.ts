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
        baseCoinSymbol: String(process.env.BASE_COIN_SYMBOL || 'LL'),
        baseCoinSymbols: String(process.env.BASE_COIN_SYMBOLS || 'LL'),
        registrationRequireEmailVerified: Boolean(process.env.REGISTRATION_REQUIRE_EMAIL_VERIFIED || false)
    },

    JWT: {
        secret: String(process.env.JWT_SECRET),
        tokenExpiresIn: String(process.env.JWT_TOKEN_EXPIRES_IN || '7d')
    },

    emailNotification: {
        fromAddress: String(process.env.EMAIL_NOTIFICATION_FROM_ADDRESS || 'tech@pellartech.com'),
        toAddress: String(process.env.EMAIL_NOTIFICATION_TO_ADDRESS || 'tech@pellartech.com')
    },

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
    }
}
