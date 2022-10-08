import { config } from '@config'
import { UserStatus } from '@config/constants'
import { randomBytes } from 'crypto'
import moment from 'moment'
import { Model, model, Schema } from 'mongoose'
import { IUser } from './user.interface'

// https://mongoosejs.com/docs/typescript/statics.html

interface IUserModel extends Model<IUser> {
    getBriefByChatName(chatName: string): IUser
    getBriefByKey(key: string, includeEmail: boolean): IUser
}

const userSchema = new Schema<IUser, IUserModel>(
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
            trim: true,
            lowercase: true,
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
        background: Object,
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
        source: String,
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
        number_of_followers: { type: Number, default: 0 },
        removed: { type: Boolean, default: false },
        token_version: { type: Number },
        bio: String,
        twitter_url: String,
        instagram_url: String,
        featured: Boolean
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
            transform: (doc, ret) => {
                delete ret._id
                delete ret.id
                return ret
            }
        },
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version',
        collection: config.database.tables.users
    }
)

userSchema.virtual('full_name').get(function (this: { first_name: string; last_name: string }) {
    return `${this.first_name || ''} ${this.last_name || ''}`
})

userSchema.statics.getBriefByChatName = function (chatName: string) {
    return this.findOne(
        { chat_name: chatName },
        {
            key: 1,
            chat_name: 1,
            avatar: 1,
            bio: 1,
            instagram_url: 1,
            twitter_url: 1
        }
    )
}

userSchema.statics.getBriefByKey = function (key: string, includeEmail: boolean) {
    const projection = { key: 1, chat_name: 1, avatar: 1, bio: 1, instagram_url: 1, twitter_url: 1, email: 1 }
    if (includeEmail) {
        projection.email = 1
    }
    return this.findOne({ key }, projection)
}

const _UserModel = model<IUser, IUserModel>(config.database.tables.users, userSchema)

export default class UserModel extends _UserModel {
    public static async generateRandomChatName(name?: string) {
        const hri = require('human-readable-ids').hri
        let chatName: string = name ?? hri.random()
        const filter = { chat_name: chatName }
        let referenceInDatabase = await this.findOne(filter).select('key chat_name').exec()

        while (referenceInDatabase != null) {
            chatName = hri.random()
            filter.chat_name = chatName
            referenceInDatabase = await this.findOne(filter).select('key chat_name').exec()
        }
        return chatName
    }
}
