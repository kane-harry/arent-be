import { randomBytes } from 'crypto'
import { CONSTANTS, MONGO } from '../../configs'
import { ModelOptionParams } from '../base/base.entity'
import { BaseModel } from '../base/base.model'

export class UserModel extends BaseModel {
  private getSecureFields(fields: { [key: string]: 0 | 1 } = {}) {
    return {
      _id: 0,
      salt: 0,
      hash: 0,
      removed: 0,
      ...fields
    }
  }

  async getByWallet(params: NAMESPACE_USER_V1.ConnectWalletParams, options: ModelOptionParams = { include_removed: false }) {
    const { wallet_address } = params
    const { include_removed } = options
    const wallet_reg = new RegExp(wallet_address, 'i')
    const conditions = include_removed ? { wallet_address: wallet_reg } : { wallet_address: wallet_reg, removed: false }

    return await MONGO.MODELS.USER.findOne(conditions, {
      projection: this.getSecureFields()
    }).exec()
  }

  async getByKey(key: string) {
    return await MONGO.MODELS.USER.findOne(
      { $or: [{ key: key }, { username: key }] },
      {
        projection: this.getSecureFields()
      }
    ).exec()
  }

  async create(params: NAMESPACE_USER_V1.CreateUserParams) {
    const key = randomBytes(CONSTANTS.user.key_size).toString('hex')
    const data = {
      ...params,
      key: params.key || key,
      first_name: params.first_name || null,
      last_name: params.last_name || null,
      username: params.wallet_address,
      wallet_address: params.wallet_address,
      nonce_text: params.nonce_text,
      nonce_text_created: new Date(),
      phone: params.phone || null,
      email: params.email || null,
      email_verified: false,
      avatar: params.avatar || { original: null },
      role: params.role,
      removed: params.removed,
      bio: params.bio || null,
      social_twitter: params.social_twitter || null,
      social_instagram: params.social_instagram || null,
      social_site: params.social_site || null,
      description: params.description || null,
      created: new Date(),
      modified: new Date()
    }

    await MONGO.MODELS.USER.create(data)
    return data
  }

  async updateNonceText(params: { key: string; nonce_text: string }) {
    const { key, nonce_text } = params
    return await MONGO.MODELS.USER.findOneAndUpdate(
      { key },
      {
        $set: { modified: new Date(), nonce_text, nonce_text_created: new Date() }
      },
      {
        projection: this.getSecureFields()
      }
    ).exec()
  }

  async updateTokenNonce(params: { key: string; nonce_text: string; token: string; token_version: number }) {
    const { key, nonce_text, token, token_version } = params
    return await MONGO.MODELS.USER.findOneAndUpdate(
      { key },
      { $set: { modified: new Date(), token_version, nonce_text, token, nonce_text_created: new Date() } },
      {
        projection: this.getSecureFields()
      }
    ).exec()
  }

  async updateTokenVersion(params: { key: string; timestamp: number }) {
    const { key } = params
    return await MONGO.MODELS.USER.findOneAndUpdate(
      { key },
      { $set: { modified: new Date(), token_version: params.timestamp } },
      {
        projection: this.getSecureFields()
      }
    ).exec()
  }
}
