import express, { Application } from 'express'
import * as bodyParser from "body-parser";
import * as mongoose from 'mongoose';

import environment from "../environment";
import { errorHandler } from "../error-handler/error.handler";
import { CommonRoutes } from "../routes/common.routes";
import { UserRoutes } from "../routes/user.routes";

class App {
    public app: Application;
    public mongoUrl: string = 'mongodb://localhost:27017/' + environment.getDBName();

    private commonRoutes: CommonRoutes = new CommonRoutes();
    private userRoutes: UserRoutes = new UserRoutes();

    constructor() {
        this.app = express();
        this.config();
        this.mongoSetup();

        this.userRoutes.route(this.app)

        // to check 404 error, keep common.routes always as the last routes in this constructor
        this.commonRoutes.route(this.app)
    }
    private config(): void {
        this.app.use(bodyParser.json());
        //supports application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false }));
        
        // error hander
        this.app.use(errorHandler);
    }
    private mongoSetup(): void {
        mongoose.connect(this.mongoUrl, { autoCreate: false });
    }
}
export default new App().app;