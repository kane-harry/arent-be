import { Request, Response } from 'express';
import UserService from '../modules/services/user.service';

import { ErrorException } from 'error-handler/error.exception';
import { ErrorCode } from 'error-handler/error.code';

export class UserController {

    private userService: UserService = new UserService();

    public createUser(req: Request, res: Response) {
        throw new ErrorException(ErrorCode.NotImplemented);
    }
    public updateUser(req: Request, res: Response) {
        throw new ErrorException(ErrorCode.Unauthorized);
    }
}