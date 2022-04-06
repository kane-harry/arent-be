import { randomBytes } from 'crypto'
import { UserModel } from './user.model'
import { BaseService } from '../base/base.service'
import { getUnixTimestamp } from '../../utils/utility'
import { Authentication, CONSTANTS, Roles } from '../../configs'
import { ApplicationError } from '../../errors'
import moment from 'moment'
import { recoverSignature } from '../../utils/ethereum'
import { omit } from 'lodash'
import { UserLogService } from '../user_logs/user.logs.service'

const userLogService = new UserLogService()
const userModel = new UserModel()

export class UserService extends BaseService {
  async toUserRO(user: any) {
    return omit(user, ['nonce_text', 'nonce_text_created'])
  }

  async connectByWallet(params: NAMESPACE_USER_V1.ConnectWalletParams, client?: { ip: any; agent: any }) {
    const { wallet_address } = params
    const lowerWalletAddress = wallet_address.toLowerCase()
    const currentUser = await userModel.getByWallet({ wallet_address: lowerWalletAddress })

    const nonce_text = randomBytes(CONSTANTS.user.nonce_text_size).toString('hex')
    if (currentUser) {
      // login
      await userModel.updateNonceText({ key: currentUser.key, nonce_text })
      return { nonce_text }
    }
    // register
    const currentTimestamp = getUnixTimestamp()
    const newUser = {
      key: randomBytes(CONSTANTS.user.key_size).toString('hex'),
      wallet_address: lowerWalletAddress,
      role: 'user' as Roles,
      avatar: {
        original: null
      },
      nonce_text,
      token_version: currentTimestamp,
      removed: false,
      username: lowerWalletAddress,
      token: ''
    }
    await userModel.create(newUser)
    await userLogService.store({
      ip_address: client?.ip,
      agent: client?.agent,
      data_before: {},
      data_after: newUser
    })
    return { nonce_text }
  }

  public async loginByWallet(params: { wallet_address: string; signature: string }) {
    const lowerWalletAddress = params.wallet_address.toLowerCase()
    const currentUser = await userModel.getByWallet({ wallet_address: lowerWalletAddress })
    if (!currentUser) {
      throw new ApplicationError('user_not_exist')
    }
    if (moment().diff(moment(currentUser.nonce_text_created), 'minutes') > CONSTANTS.user.signature.expired_time) {
      throw new ApplicationError('unauthorized_error')
    }

    if (lowerWalletAddress !== String(recoverSignature(currentUser.nonce_text, params.signature)).toLowerCase()) {
      throw new ApplicationError('unauthorized_error')
    }
    const currentTimestamp = getUnixTimestamp()
    currentUser.token_version = currentTimestamp
    // make new nonce_text
    const nonce_text = randomBytes(CONSTANTS.user.nonce_text_size).toString('hex')

    const userAuth = new Authentication({
      avatar: currentUser.avatar,
      key: currentUser.key,
      nonce_text: currentUser.nonce_text,
      role: currentUser.role,
      token_version: currentUser.token_version,
      wallet_address: currentUser.wallet_address
    })
    currentUser.token = userAuth.generateJWT()
    await userModel.updateTokenNonce({ key: currentUser.key, nonce_text, token_version: currentTimestamp, token: currentUser.token })
    return await this.toUserRO(currentUser)
  }

  public async logoutByWallet(params: { wallet_address: string }) {
    const lowerWalletAddress = params.wallet_address.toLowerCase()
    const currentUser = await userModel.getByWallet({ wallet_address: lowerWalletAddress })
    if (!currentUser) {
      throw new ApplicationError('user_not_exist')
    }
    const currentTimestamp = getUnixTimestamp()
    await userModel.updateTokenVersion({ key: currentUser.key, timestamp: currentTimestamp })
    return true
  }
}
