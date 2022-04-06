import { Roles } from '../roles'

export const userSchema = {
  avatar: {
    type: Object,
    required: false,
    default: {}
  },
  bio: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  first_name: {
    type: String,
    required: false
  },
  key: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: false
  },
  removed: {
    type: Boolean,
    required: false,
    default: false
  },
  role: {
    type: String,
    required: false,
    default: 'user' as Roles
  },
  social_instagram: {
    type: String,
    required: false
  },
  social_site: {
    type: String,
    required: false
  },
  social_twitter: {
    type: String,
    required: false
  },
  token: {
    type: String,
    required: false
  },
  token_version: {
    type: String,
    required: false
  },
  username: {
    type: String,
    required: false
  },
  wallet_address: {
    type: String,
    required: true
  },
  nonce_text: {
    type: String,
    required: false
  },
  nonce_text_created: {
    type: Date,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    required: false,
    default: new Date()
  },
  modified_at: {
    type: Date,
    required: false,
    default: new Date()
  }
}
