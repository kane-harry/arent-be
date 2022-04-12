import passportJWT from "passport-jwt";
import { PassportStatic } from "passport";
import UserModel from '../modules/user/user.model';
const JwtStrategy = passportJWT.Strategy, ExtractJwt = passportJWT.ExtractJwt;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}

export default (passport: PassportStatic) => {
    passport.use(new JwtStrategy(opts, function (payload, done) {
        UserModel.findById(payload.id)
            .then(user => {
                if (!user) {
                    return done(null, false);
                } else {
                    // if (user.locked === true) {
                    //     return done(null, false);
                    // }
                    // if (user.token_version > jwt_payload.token_version) {
                    //     return done(null, false);
                    // }
                    return done(null, user);
                }
            }).catch(error => {
                return done(error);
            });
    }));
}