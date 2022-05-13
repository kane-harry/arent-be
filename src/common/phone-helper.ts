import UserModel from '@modules/user/user.model'
const phoneNumber = require('libphonenumber-js')

async function stripPhoneNumber(phoneNumber: string) {
    if (typeof phoneNumber === 'string') {
        return phoneNumber.replace(/\D/g, '')
    }
    return phoneNumber
}

async function formatPhoneNumberWithSymbol(phone: string) {
    phone = await stripPhoneNumber(phone)
    return `+${phone}`
}

async function associatedPhoneCheck(phone: string, userkey: any) {
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

async function getPhoneInfo(phone: string) {
    const formatted = await formatPhoneNumberWithSymbol(phone)
    let result = {
        isValid: false,
        number: ''
    }
    const phoneInfo = phoneNumber.parsePhoneNumberFromString(formatted)
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

export default stripPhoneNumber
