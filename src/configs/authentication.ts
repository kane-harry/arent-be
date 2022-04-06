import jwt from 'jsonwebtoken'
import { CONFIG } from './index'

export class Authentication {
  public user: { key: string; role: any; nonce_text: string; avatar: any; wallet_address: string; token_version: number }

  constructor(user: { key: string; role: any; nonce_text: string; avatar: any; wallet_address: string; token_version: number }) {
    this.user = user
  }

  generateJWT() {
    return jwt.sign(this.user, CONFIG.JWT_SECRET, { expiresIn: CONFIG.SECURITY_JWT_TOKEN_EXPIRES_IN })
  }
}
