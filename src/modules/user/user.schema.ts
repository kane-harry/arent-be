import { check } from 'express-validator'
import { isValidAddress } from '../../utils/ethereum'

export const connect_wallet = [
  check('wallet_address').trim().isLength({ min: 1 }).withMessage('Wallet address must not be empty.'),
  check('wallet_address')
    .custom(address => {
      return isValidAddress(address)
    })
    .withMessage('Wallet address is not valid.')
]

export const login_by_wallet = [
  check('wallet_address').trim().isLength({ min: 1 }).withMessage('Wallet address must not be empty.'),
  check('signature').trim().isLength({ min: 1 }).withMessage('Signature must not be empty.'),
  check('wallet_address')
    .custom(address => {
      return isValidAddress(address)
    })
    .withMessage('Wallet address is not valid.')
]
