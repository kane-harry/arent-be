import HttpException from '../../exceptions/HttpException';
import { Router, Request, Response, NextFunction } from 'express';
import Controller from "../../interfaces/controller.interface";
import validationMiddleware from '../../middlewares/validation.middleware';
import CreateUserDto from './user.dto';
import IUser from './user.interface';
import UserService from './user.service';

class UserController implements Controller {
    public path = '/users';
    public router = Router();

    // private userService: UserService = new UserService();

    constructor() {
        this.initRoutes();
    }

    private initRoutes() {
        this.router.post(`${this.path}`, validationMiddleware(CreateUserDto), this.createUser);
        this.router.get(`${this.path}/:id`, this.getUserById);
        // this.router.get(`${this.path}/:id/posts`, authMiddleware, this.getAllPostsOfUser);
    }

    private createUser = async (req: Request, res: Response, next: NextFunction) => {
        const postData: IUser = req.body;
        const data = await UserService.createUser(postData)

        res.send(data);
    }

    private getUserById = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const data = await UserService.getUserById(id)
        if (!data) {
            next(new HttpException(404, 'User Not Found'))
        }
        res.send(data);
    }
}

export default UserController;