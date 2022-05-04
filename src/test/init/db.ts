import mongoose from 'mongoose'
import mongoUnit from 'mongo-unit'
import UserModel from '@modules/user/user.model'

export const dbTest = {
    mongoose,
    mongoUnit,
    connect: async () => {
        await mongoose.disconnect()
        await mongoUnit.start()
        const mongoUrl = mongoUnit.getUrl()
        await mongoose.connect(mongoUrl)
    },
    disconnect: async () => {
        await mongoose.disconnect()
        await mongoUnit.stop()
    }
}

export const MODELS = {
    UserModel
}
