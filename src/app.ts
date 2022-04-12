import express from 'express'
import * as bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'

import IController from './interfaces/controller.interface'
import errorMiddleware from './middlewares/error.middleware'
import requestMiddleware from './middlewares/request.middleware'
// import loggerMiddleware from './middlewares/logger.middleware';
import passport from 'passport'
import authz from './middlewares/authz.middleware'

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
    this.app.listen(process.env.PORT, () => {
      // this.app.use(errorMiddleware);
      console.log(`Server is listening on the port ${process.env.PORT}`)
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
    const { MONGO_URL } = process.env
    mongoose.connect(String(MONGO_URL))
  }
}

export default App
// export default new App().app;
