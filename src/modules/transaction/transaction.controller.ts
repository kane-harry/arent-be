import asyncHandler from "../../common/asyncHandler"
import { Router, Request, Response, NextFunction } from 'express';
import IController from "../../interfaces/controller.interface";
import validationMiddleware from '../../middlewares/validation.middleware';
import TransactionService from './transaction.service';


class TransactionController implements IController {
    public path = '/transactions';
    public router = Router();

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.post(`${this.path}/send`, asyncHandler(this.send));
    }

    private send = async (req: Request, res: Response, next: NextFunction) => {
        const postData: any = req.body;
        const data = await TransactionService.createCreateTransaction(postData)

        return res.send(data);
    }


}

export default TransactionController;