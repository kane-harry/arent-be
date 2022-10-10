import passportJWT from 'passport-jwt'
import { PassportStatic } from 'passport'
import UserModel from '@modules/user/user.model'
import { config } from '@config'
import { UserStatus } from '@config/constants'
const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtAccess.secret
}

export default (passport: PassportStatic) => {
    passport.use(
        new JwtStrategy(opts, async (payload, done) => {
            const user = await UserModel.findOne(
                { key: payload.key, removed: false },
                { key: 1, chat_name: 1, role: 1, status: 1, token_version: 1 }
            ).exec()
            if (!user) {
                return done(null, false)
            }
            if (user.status !== UserStatus.Normal) {
                return done(null, false)
            }
            if (user.token_version && user.token_version > payload.token_version) {
                return done(null, false)
            }
            return done(null, { key: user.key, chat_name: user.chat_name, role: user.role })
        })
    )
}
