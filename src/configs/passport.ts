import passport from 'passport'
import passportJWT from 'passport-jwt'
import { UserModel } from '../modules/user/user.model'
import { CONFIG } from './index'

const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt

const userModel = new UserModel()

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: CONFIG.JWT_SECRET
}

export const passportSystem = () => {
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      userModel
        .getByKey(jwt_payload.key)
        .then(user => {
          if (!user) {
            return done(null, false)
          }
          if (user.locked === true) {
            return done(null, false)
          }
          if (user.token_version > jwt_payload.token_version) {
            return done(null, false)
          }
          return done(null, user)
        })
        .catch(error => {
          return done(error)
        })
    })
  )
}
