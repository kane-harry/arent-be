import { config } from '@config'
import { randomBytes } from 'crypto'
import moment from 'moment'
import { Schema, model } from 'mongoose'
import { IUser, UserStatus } from './user.interface'

const userSchema = new Schema<IUser>(
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
        first_name: String,
        last_name: String,
        chat_name: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
            required: true,
            index: true
        },
        email: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
            required: true,
            index: true
        },
        password: {
            type: String,
            get: (): undefined => undefined
        },
        pin: {
            type: String,
            get: (): undefined => undefined
        },
        phone: String,
        country: String,
        avatar: Object,
        player_id: String,
        status: {
            type: String,
            enum: UserStatus,
            default: UserStatus.Normal
        },
        role: Number,
        email_verified: { type: Boolean, default: false },
        phone_verified: { type: Boolean, default: false },
        kyc_verified: { type: Boolean, default: false },
        totp_temp_secret: String,
        totp_secret: {
            type: String,
            get: (): undefined => undefined
        },
        totp_setup: { type: Boolean, default: false },
        mfa_settings: { type: Object, default: { type: 'EMAIL', login_enabled: false, withdraw_enabled: false } },
        change_password_next_login: { type: Boolean, default: false },
        change_password_next_login_timestamp: { type: Number, default: moment().unix() },
        change_password_next_login_code: {
            type: String
        },
        change_password_next_login_attempts: { type: Number, default: 0 },
        locked_timestamp: { type: Number, default: 0 },
        login_count: { type: Number, default: 0 },
        removed: { type: Boolean, default: false },
        token_version: { type: Number }
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
        collection: config.database.tables.users
    }
)

userSchema.virtual('fullName').get(function (this: { firstName: string; lastName: string }) {
    return `${this.firstName} ${this.lastName}`
})

const UserModel = model<IUser>(config.database.tables.users, userSchema)

export default UserModel
