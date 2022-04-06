import { Application, Request, Response } from 'express';
import { UserController } from '../controllers/user.controller';

export class UserRoutes {
    private userController: UserController = new UserController();

    public route(app: Application) {
        app.post('/users', (req: Request, res: Response) => {
            this.userController.createUser(req, res);
        });
        app.put('/users', (req: Request, res: Response) => {
            this.userController.updateUser(req, res);
        });
        // app.get('/users', (req: Request, res: Response) => {
        //     //
        // });
    }
}