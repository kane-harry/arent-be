// import asyncHandler from "express-async-handler"
import BaseError from '../../exceptions/BaseError';
import { Router, Request, Response, NextFunction } from 'express';
import Controller from "../../interfaces/controller.interface";
import validationMiddleware from '../../middlewares/validation.middleware';
import CreateUserDto from './user.dto';
import IUser from './user.interface';
import UserService from './user.service';

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

class UserController implements Controller {
    public path = '/users';
    public router = Router();

    // private userService: UserService = new UserService();

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.post(`${this.path}`, validationMiddleware(CreateUserDto), asyncHandler(this.createUser));
        this.router.get(`${this.path}/:id`, asyncHandler(this.getUserById));
        this.router.get(`${this.path}`, asyncHandler(this.queryUsers));
    }

    private createUser = async (req: Request, res: Response, next: NextFunction) => {
        const postData: IUser = req.body;
        const data = await UserService.createUser(postData)

        return res.send(data);
    }

    private getUserById = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const data = await UserService.getUserById(id)
        if (!data) {
            next(new BaseError(404, 'User Not Found'));
        } else {
            res.send(data);
        }

    }
    private queryUsers = async (req: Request, res: Response, next: NextFunction) => {
        throw new BaseError(400, 'Users Not Found');
    }
}

export default UserController;