import { Schema, model } from 'mongoose'
import { IUser } from './user.interface'

const userSchema = new Schema<IUser>(
    {
        firstName: String,
        lastName: String,
        nickName: String,
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
        roleId: { type: Number, default: 0 },
        pin: {
            type: String,
            get: (): undefined => undefined
        },
        phone: String,
        country: String,
        avatar: String,
        playerId: String,
        status: String,
        emailVerified: { type: Boolean, default: false },
        removed: { type: Boolean, default: false, get: (): undefined => undefined }
        // created: { type: Date, default: Date.now },
        // modified: { type: Date, default: Date.now }
    },
    {
        toJSON: {
            virtuals: true,
            getters: true
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        }
    }
)

userSchema.virtual('fullName').get(function (this: { firstName: string; lastName: string }) {
    return `${this.firstName} ${this.lastName}`
})

const UserModel = model<IUser>('users', userSchema)

export default UserModel
