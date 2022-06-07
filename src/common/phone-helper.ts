import UserModel from '@modules/user/user.model'
const phoneLib = require('libphonenumber-js')

export const stripPhoneNumber = async (phoneNumber: any) => {
    if (typeof phoneNumber === 'string') {
        return phoneNumber.replace(/\D/g, '')
    }
    return phoneNumber
}

export const formatPhoneNumberWithSymbol = async (phone: any) => {
    phone = await stripPhoneNumber(phone)
    return `+${phone}`
}

export const associatedPhoneCheck = async (phone: string, userkey: any) => {
    let valid = true

    const strippedNumber = await stripPhoneNumber(phone)
    const user = await UserModel.findOne({ phone: strippedNumber }).exec()
    if (user) {
        if (userkey && user.key === userkey) {
            valid = true
        } else {
            valid = false
        }
    }

    return valid
}

export const getPhoneInfo = async (phone: string) => {
    const formatted = await formatPhoneNumberWithSymbol(phone)
    let result = {
        isValid: false,
        number: ''
    }
    const phoneInfo = phoneLib.parsePhoneNumberFromString(formatted)
    if (phoneInfo) {
        phoneInfo.isValid = phoneInfo.isValid()

        if (!phoneInfo.isValid) {
            return result
        }

        phoneInfo.country = phoneInfo.country.toUpperCase()
        result = phoneInfo
    }
    result.number = await stripPhoneNumber(phone)
    return result
}
