import 'dotenv/config'
import App from './app'
// import validateEnv from './common/validateEnv'
import AuthController from './modules/auth/auth.controller'
import UserController from './modules/user/user.controller'
import AccountController from './modules/account/account.controller'
import AccountMasterController from './modules/account.master/account.master.controller'
import TransactionController from './modules/transaction/transaction.controller'
import VerificationCodeController from './modules/verification_code/code.controller'

// validateEnv()
const app = new App([
    new VerificationCodeController(),
    new AuthController(),
    new UserController(),
    new AccountController(),
    new AccountMasterController(),
    new TransactionController()
])

app.listen()
