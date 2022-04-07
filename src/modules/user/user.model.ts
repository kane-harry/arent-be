import * as mongoose from 'mongoose';
import User from './user.interface';

const userSchema = new mongoose.Schema(
    {
        email: String,
        firstName: String,
        lastName: String,
        password: {
            type: String,
            get: (): undefined => undefined,
        },
    },
    {
        toJSON: {
            virtuals: true,
            getters: true,
        },
    },
);

const UserModel = mongoose.model<User & mongoose.Document>('users', userSchema);

export default UserModel;