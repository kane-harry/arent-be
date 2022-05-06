import chai from 'chai'
import mongoose from 'mongoose'
import mongoUnit from 'mongo-unit'
import UserModel from '@modules/user/user.model'
import VerificationCode from '@modules/verification_code/code.model'
import AccountModel from '@modules/account/account.model'
const { expect, assert } = chai

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
        if (mongoose) {
            await mongoose.disconnect()
        }
        if (mongoUnit) {
            await mongoUnit.stop()
        }
    }
}

export const MODELS = {
    UserModel,
    VerificationCode,
    AccountModel
}

export const validResponse = (data: any) => {
    const jsonData = JSON.stringify(data)
    expect(jsonData).not.include("_id")
}
