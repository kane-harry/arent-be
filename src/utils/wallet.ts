import crypto from 'crypto'
import { ethers } from 'ethers'

import { config } from '@config'

async function createEtherWallet() {
    const wallet = ethers.Wallet.createRandom()
    const salt = crypto.randomBytes(16).toString('hex')
    const secret = config.system.secret
    // const wallet = new ethers.Wallet(ethers.utils.randomBytes(32))
    const saltHash = crypto.createHmac('sha256', secret).update(salt).digest('hex')
    const keyStore = await wallet.encrypt(saltHash)
    return {
        address: wallet.address,
        salt: salt,
        keyStore: JSON.parse(keyStore),
        privateKey: wallet.privateKey
    }
}

async function decryptKeyWithSalt(keystoreJsonV3: object, salt: string) {
    const secret = config.system.secret
    const saltHash = crypto.createHmac('sha256', secret).update(salt).digest('hex')

    const result = ethers.Wallet.fromEncryptedJsonSync(JSON.stringify(keystoreJsonV3), saltHash)
    return result.privateKey
}

async function signMessage(privateKey: string, message: string) {
    const wallet = new ethers.Wallet(privateKey)
    const flatSig = await wallet.signMessage(message)

    return flatSig
}

export { createEtherWallet, decryptKeyWithSalt, signMessage }
