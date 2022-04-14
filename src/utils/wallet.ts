import crypto from 'crypto'
import { ethers } from 'ethers'

import { config } from '../config'

async function createWallet() {
    const wallet = ethers.Wallet.createRandom()
    const salt = crypto.randomBytes(16).toString('hex')
    // const wallet = new ethers.Wallet(ethers.utils.randomBytes(32))
    const saltHash = crypto.createHmac('sha256', config.system.secret).update(salt).digest('hex')
    const keyStore = await wallet.encrypt(wallet.privateKey, saltHash)
    return {
        address: wallet.address,
        salt: salt,
        keyStore: JSON.parse(keyStore)
    }
}

export { createWallet }
