import UserModel from '@modules/user/user.model'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export const stripPhoneNumber = (phoneNumber: any) => {
    if (typeof phoneNumber === 'string') {
        return phoneNumber.replace(/\D/g, '')
    }
    return phoneNumber
}

export const formatPhoneNumberWithSymbol = (phone: any) => {
    return `+${stripPhoneNumber(phone)}`
}

export const associatedPhoneCheck = async (phone: string, userKey: any) => {
    let valid = true

    const strippedNumber = stripPhoneNumber(phone)
    const user = await UserModel.findOne({ phone: strippedNumber }).exec()
    if (user) {
        if (userKey && user.key === userKey) {
            valid = true
        } else {
            valid = false
        }
    }

    return valid
}

export const getPhoneInfo = (phone: string) => {
    const formatted = formatPhoneNumberWithSymbol(phone)
    const result = {
        is_valid: false,
        phone: '',
        country: ''
    }
    const phoneInfo = parsePhoneNumberFromString(formatted)
    if (phoneInfo) {
        result.is_valid = phoneInfo.isValid()
        result.country = String(phoneInfo.country).toUpperCase()
        result.phone = stripPhoneNumber(phone)
    }

    return result
}
