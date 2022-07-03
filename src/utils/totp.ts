const speakeasy = require('speakeasy')

function generateToken(secret: string) {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    })
}
function getNewSecret() {
    const secret = speakeasy.generateSecret()
    return {
        secret: secret.base32,
        otpURL: 'otpauth://totp/SecretKey?secret=' + secret.base32
    }
}
function verifyNewDevice(secret: string | undefined, token1: string, token2: string) {
    const verified1 = speakeasy.totp.verify({ secret: secret, encoding: 'base32', token: token1, window: 3 })
    const verified2 = speakeasy.totp.verify({ secret: secret, encoding: 'base32', token: token2, window: 3 })
    return verified1 && verified2
}

function verifyToken(secret: string, token: string) {
    return speakeasy.totp.verify({ secret: secret, encoding: 'base32', token: token, window: 3 })
}

export { generateToken, getNewSecret, verifyNewDevice, verifyToken }
