import passportJWT from 'passport-jwt'
import { PassportStatic } from 'passport'
import UserModel from '@modules/user/user.model'
import { config } from '@config'
const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtAccess.secret
}

export default (passport: PassportStatic) => {
    passport.use(
        new JwtStrategy(opts, async (payload, done) => {
            const user = await UserModel.findById(payload.id || payload.key).exec()
            if (!user || payload.token_version !== user.token_version) {
                return done(null, false)
            }
            return done(null, user)
        })
    )
}
