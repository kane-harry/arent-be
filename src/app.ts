import express from "express";
import * as bodyParser from "body-parser";
import mongoose from 'mongoose';

import Controller from './interfaces/controller.interface';
import errorMiddleware from './middlewares/error.middleware';
import loggerMiddleware from './middlewares/logger.middleware';
import asyncHandler from "express-async-handler"

class App {
    public app: express.Application;
    constructor(controllers: Controller[]) {
        this.app = express();

        this.connectToDb();
        this.initMiddlewares();
        this.initErrorHandling();
        this.initControllers(controllers);

    }
    public listen() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server is listening on the port ${process.env.PORT}`);
        });
    }
    public getServer() {
        return this.app;
    }

    private initMiddlewares(): void {
        // support application/json type post data
        this.app.use(bodyParser.json());

        // support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }

    private initErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initControllers(controllers: Controller[]) {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }

    private connectToDb() {
        const {
            MONGO_URL,
        } = process.env;
        mongoose.connect('mongodb://localhost:27017/db-test');
    }

}

export default App;