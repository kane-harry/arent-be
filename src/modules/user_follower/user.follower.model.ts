import { model, Schema } from 'mongoose'
import { randomBytes } from 'crypto'
import { IUserFollower } from '@modules/user_follower/user.follower.interface'

const userFollowerSchema = new Schema<IUserFollower>(
    {
        key: {
            type: String,
            required: true,
            index: true,
            unique: true,
            default: () => {
                return randomBytes(8).toString('hex')
            }
        },
        user_key: String,
        follower_key: String
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'modified'
        },
        versionKey: 'version'
    }
)

const UserFollowerModel = model<IUserFollower>('user_followers', userFollowerSchema)

export default UserFollowerModel
