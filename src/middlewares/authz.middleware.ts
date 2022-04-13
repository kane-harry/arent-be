import passportJWT from 'passport-jwt'
import { PassportStatic } from 'passport'
import UserModel from '../modules/user/user.model'
import { config } from '../config'
const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.JWT.secret
}

export default (passport: PassportStatic) => {
    passport.use(
        new JwtStrategy(opts, async (payload, done) => {
            const user = await UserModel.findById(payload.id).exec()
            if (!user) {
                return done(null, false)
            }
            return done(null, user)
        })
    )
}
