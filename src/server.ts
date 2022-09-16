import 'dotenv/config'
import App from './app'
import UserRouter from '@modules/user/user.router'
import AuthRouter from '@modules/auth/auth.router'
import AccountRouter from '@modules/account/account.router'
import TransactionRouter from '@modules/transaction/transaction.router'
import BlockchainRouter from '@modules/blockchain/blockchain.router'
import VerificationCodeRouter from '@modules/verification_code/code.router'
import SiteRouter from '@modules/site/site.router'
import SettingRouter from '@modules/setting/setting.router'
import AdminLogRouter from '@modules/admin_logs/admin_log.router'
import NftRouter from '@modules/nft/nft.router'
import CollectionRouter from '@modules/collection/collection.router'
import RateRouter from '@modules/exchange_rate/rate.router'

const app = new App([
    new UserRouter(),
    new AccountRouter(),
    new AuthRouter(),
    new AdminLogRouter(),
    new BlockchainRouter(),
    new CollectionRouter(),
    new NftRouter(),
    new SettingRouter(),
    new RateRouter(),
    new SiteRouter(),
    new TransactionRouter(),
    new VerificationCodeRouter()
])

app.listen()

export default app
