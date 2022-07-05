import { generateUnixTimestamp } from '@common/utility'
import moment from 'moment'
import { Schema, model } from 'mongoose'
import { IUser, UserStatus } from './user.interface'

const userSchema = new Schema<IUser>(
    {
        key: { type: String, required: true, index: true, unique: true },
        firstName: String,
        lastName: String,
        chatName: {
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
        playerId: String,
        status: {
            type: String,
            enum: UserStatus,
            default: UserStatus.Normal
        },
        role: Number,
        emailVerified: { type: Boolean, default: false },
        phoneVerified: { type: Boolean, default: false },
        kycVerified: { type: Boolean, default: false },
        totpTempSecret: String,
        totpSecret: {
            type: String,
            get: (): undefined => undefined
        },
        totpSetup: { type: Boolean, default: false },
        mfaSettings: { type: Object, default: { type: 'EMAIL', loginEnabled: false, withdrawEnabled: false } },
        changePasswordNextLogin: { type: Boolean, default: false },
        changePasswordNextLoginTimestamp: { type: Number, default: moment().unix() },
        changePasswordNextLoginCode: {
            type: String,
            get: (): undefined => undefined
        },
        changePasswordNextLoginAttempts: { type: Number, default: 0 },
        lockedTimestamp: { type: Number, default: 0 },
        loginCount: { type: Number, default: 0 },
        removed: { type: Boolean, default: false },
        tokenVersion: { type: Number }
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

userSchema.virtual('fullName').get(function (this: { firstName: string; lastName: string }) {
    return `${this.firstName} ${this.lastName}`
})

const UserModel = model<IUser>('users', userSchema)

export default UserModel
