import { config } from '@config'
import { Schema, model } from 'mongoose'
import { AuthTokenType, IAuthToken } from './auth.interface'
import * as jwt from 'jsonwebtoken'

const authSchema = new Schema<IAuthToken>(
    {
        userId: {
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
        versionKey: 'version'
    }
)

export class AuthModel extends model<IAuthToken>('auth_tokens', authSchema) {
    public static createAccessToken(userId: string) {
        const expiresIn = config.JWT_Access.tokenExpiresIn
        const secret = String(config.JWT_Access.secret)
        // TODO: add client id ? not allow multiple device ?
        const payload = {
            id: userId
        }
        return jwt.sign(payload, secret, { expiresIn })
    }

    public static createRefreshToken(userId: string) {
        const expiresIn = config.JWT_Refresh.tokenExpiresIn
        const secret = String(config.JWT_Refresh.secret)
        // TODO: add client id ? not allow multiple device ?
        const payload = {
            id: userId
        }
        return jwt.sign(payload, secret, { expiresIn })
    }

    public static verifyRefreshToken(token: string) {
        const secret = String(config.JWT_Refresh.secret)
        return jwt.verify(token, secret)
    }
}
