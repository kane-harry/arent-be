const speakeasy = require('speakeasy')

function generateTotpToken(secret: string) {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    })
}
function verifyTotpToken(secret: string, token: string | null) {
    return speakeasy.totp.verifyDelta({
        secret: secret,
        token: token,
        encoding: 'base32',
        window: 3
    })
}

export { generateTotpToken, verifyTotpToken }
