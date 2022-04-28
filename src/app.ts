import express from 'express'
import * as bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'

import IController from '@interfaces/controller.interface'
import errorMiddleware from '@middlewares/error.middleware'
import requestMiddleware from '@middlewares/request.middleware'
// import loggerMiddleware from '@middlewares/logger.middleware';
import passport from 'passport'
import authz from '@middlewares/authz.middleware'
import { config } from '@config'

class App {
    public app: express.Application
    constructor(controllers: IController[]) {
        this.app = express()

        this.connectToDb()
        this.initMiddlewares()
        this.initControllers(controllers)
        this.initErrorHandling()
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
        this.app.use(bodyParser.json())
        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }))

        this.app.use(cors())
        this.app.use(helmet())
        this.app.use(requestMiddleware)
        this.app.use(passport.initialize())
        authz(passport)
    }

    private initErrorHandling() {
        this.app.use(errorMiddleware)
    }

    private initControllers(controllers: IController[]) {
        controllers.forEach(controller => {
            this.app.use('/', controller.router)
        })
    }

    private connectToDb() {
        mongoose.connect(config.system.mongoUrl)
        this.overwriteToJson()
    }

    private overwriteToJson() {
        mongoose.set('toJSON', {
            virtuals: true,
            transform: (doc, converted) => {
                if (converted._id) {
                    converted.id = converted._id
                    delete converted._id
                }
                return converted
            }
        })
    }
}

export default App
// export default new App().app;
