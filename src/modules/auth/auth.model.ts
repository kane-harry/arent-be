import { config } from '@config'
import { Schema, model } from 'mongoose'
import { IAuthToken } from './auth.interface'
import * as jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { AuthTokenType } from '@config/constants'

const authSchema = new Schema<IAuthToken>(
    {
        key: {
            type: String,
            required: true,
            index: true,
            unique: true,
            default: () => {
                return randomBytes(16).toString('hex')
            }
        },
        user_key: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        type: {
            type: String,
            enum: AuthTokenType,
            default: AuthTokenType.RefreshToken
        },
        removed: { type: Boolean, default: false, get: (): undefined => undefined }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.auth_tokens
    }
)

export class AuthModel extends model<IAuthToken>(config.database.tables.auth_tokens, authSchema) {
    public static createAccessToken(userKey: string, tokenVersion: number) {
        const expiresIn = config.jwtAccess.tokenExpiresIn
        const secret = String(config.jwtAccess.secret)
        // TODO: add client id ? not allow multiple device ?
        const payload = {
            key: userKey,
            tokenVersion: tokenVersion
        }
        return jwt.sign(payload, secret, { expiresIn })
    }

    public static createRefreshToken(userKey: string) {
        const expiresIn = config.jwtRefresh.tokenExpiresIn
        const secret = String(config.jwtRefresh.secret)
        // TODO: add client id ? not allow multiple device ?
        const payload = {
            key: userKey
        }
        return jwt.sign(payload, secret, { expiresIn })
    }

    public static verifyRefreshToken(token: string) {
        const secret = String(config.jwtRefresh.secret)
        return jwt.verify(token, secret)
    }
}
