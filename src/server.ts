import 'dotenv/config'
import App from './app'
import AuthController from '@modules/auth/auth.controller'
import UserController from '@modules/user/user.controller'
import { UserAccountController, AdminAccountController } from '@modules/account/account.controller'
import TransactionController from '@modules/transaction/transaction.controller'
import BlockchainController from '@modules/blockchain/blockchain.controller'
import VerificationCodeController from '@modules/verification_code/code.controller'
import SiteController from '@modules/site/site.controller'
import SettingController from '@modules/setting/setting.controller'
import AdminLogController from '@modules/admin_logs/admin_log.controller'

const app = new App([
    new VerificationCodeController(),
    new AuthController(),
    new UserController(),
    new UserAccountController(),
    new AdminAccountController(),
    new TransactionController(),
    new BlockchainController(),
    new SiteController(),
    new SettingController(),
    new AdminLogController()
])

app.listen()

export default app
