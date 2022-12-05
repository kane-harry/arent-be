import express from 'express'
import * as bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'

import errorMiddleware from '@middlewares/error.middleware'
import requestMiddleware from '@middlewares/request.middleware'
// import loggerMiddleware from '@middlewares/logger.middleware';
import passport from 'passport'
import authz from '@middlewares/authz.middleware'
import { config } from '@config'
import SettingService from '@modules/setting/setting.service'
import swaggerUI from 'swagger-ui-express'
import { openApiV1Documents } from '@docs/openApiGenerator'
import ICustomRouter from '@interfaces/custom.router.interface'
import RateScheduler from '@modules/jobs/rate.schedule'
import NftScheduler from '@modules/jobs/nft.scheduler'
import RankingScheduler from '@modules/jobs/ranking.scheduler'
import IpfsScheduler from '@modules/jobs/ipfs.scheduler'
import RarityScheduler from '@modules/jobs/rarity.scheduler'
import TokenCandlesScheduler from '@modules/jobs/token.candles.schedule'

class App {
    public app: express.Application
    constructor(routers: ICustomRouter[]) {
        this.app = express()

        this.connectToDb()
        this.initMiddlewares()
        this.initRouters(routers)
        this.initErrorHandling()
        this.initSwaggerDocs()
        this.initSchedulers()
    }

    public listen() {
        this.app.listen(config.port, () => {
            // this.app.use(errorMiddleware);
            console.log(`Server is listening on the port ${config.port}`)
        })
    }

    public getServer() {
        return this.app
    }

    private initMiddlewares(): void {
        // support application/json type post data
        this.app.use(bodyParser.json({ limit: '100mb' }))
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }))

        this.app.use(cors())
        this.app.use(helmet())
        this.app.use(requestMiddleware)
        this.app.use(passport.initialize())
        authz(passport)
    }

    private initErrorHandling() {
        this.app.use(errorMiddleware)
    }

    private initRouters(customRouters: ICustomRouter[]) {
        customRouters.forEach(router => {
            this.app.use('/api/v1', router.router)
        })
    }

    private connectToDb() {
        mongoose.connect(config.database.mongoUrl).then(() => {
            SettingService.initGlobalSetting()
        })
        this.overwriteToJson()
    }

    private overwriteToJson() {
        mongoose.set('toJSON', {
            virtuals: true,
            transform: (doc, converted) => {
                if (converted._id) {
                    delete converted._id
                }
                return converted
            }
        })
    }

    private initSwaggerDocs() {
        this.app.use('/api-v1-docs', swaggerUI.serve, swaggerUI.setup(openApiV1Documents))
    }

    private initSchedulers() {
        return [
            new RateScheduler(),
            new NftScheduler(),
            new RankingScheduler(),
            new IpfsScheduler(),
            new RarityScheduler(),
            new TokenCandlesScheduler()
        ]
    }
}

export default App
// export default new App().app;
