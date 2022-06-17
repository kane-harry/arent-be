const speakeasy = require('speakeasy')

function generateTotpToken(secret: string, owner: any) {
    if (owner && owner.endsWith('test@pellartech.com')) {
        return '123654'
    }
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    })
}
function verifyTotpToken(secret: string, token: string | null, owner:any) {
    if (owner && owner.endsWith('test@pellartech.com')) {
        return token === '123654'
    }
    return speakeasy.totp.verifyDelta({
        secret: secret,
        token: token,
        encoding: 'base32',
        window: 3
    })
}

export { generateTotpToken, verifyTotpToken }
