import userRegister from './register.json'
import forgotPassword from './password.forgot.json'
import resetPassword from './password.reset.json'
import forgotPin from './pin.forgot.json'
import resetPin from './pin.reset.json'
export default {
    '/users/register': {
        post: userRegister
    },
    '/users/password/forgot': {
        post: forgotPassword
    },
    '/users/password/reset': {
        post: resetPassword
    },
    '/users/pin/forgot': {
        post: forgotPin
    },
    '/users/pin/reset': {
        post: resetPin
    }
}
