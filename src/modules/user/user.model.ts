import { Schema, model } from 'mongoose'
import { IUser, Permission, UserStatus } from './user.interface'

const permissionSchema = new Schema<Permission>(
    {
        action: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
            required: true
        },
        resource: {
            type: String,
            unique: true,
            trim: true,
            required: true
        }
    },
    { _id: false, versionKey: 'version' }
)

const userSchema = new Schema<IUser>(
    {
        key: { type: String, required: true, index: true, unique: true },
        firstName: String,
        lastName: String,
        nickName: {
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
        permissions: { type: [permissionSchema], default: [] },
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
        emailVerified: { type: Boolean, default: false },
        phoneVerified: { type: Boolean, default: false },
        removed: { type: Boolean, default: false },
        twoFactorSecret: {
            type: String,
            get: (): undefined => undefined
        },
        role: Number,
        MFASettings: { type: Object, default: { MFAType: 'EMAIL', loginEnabled: true, withdrawEnabled: true } }
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
