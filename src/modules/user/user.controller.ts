// import asyncHandler from '../../common/asyncHandler'
import {
  Router //
  //   Request,
  //   Response,
  //   NextFunction
} from 'express'
import IController from '../../interfaces/controller.interface'
// import validationMiddleware from '../../middlewares/validation.middleware'
// import { CreateUserDto } from './user.dto'
// import { IUser, IUserFilter } from './user.interface'
// import UserService from './user.service'
// import { CustomRequest } from '../../middlewares/request.middleware'

class UserController implements IController {
  public path = '/users'
  public router = Router()

  constructor() {
    this.initRoutes()
  }

  private initRoutes() {
    // this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), asyncHandler(this.createAccount));
    // this.router.get(`${this.path}/:address`, asyncHandler(this.getAccount));
    // this.router.get(`${this.path}`, asyncHandler(this.queryAccounts));
  }

  // private createAccount = async (req: Request, res: Response, next: NextFunction) => {
  //     const postData: IUser = req.body;
  //     const data = await UserService.createAccount(postData)

  //     return res.send(data);
  // }

  // private getAccount = async (req: Request, res: Response, next: NextFunction) => {
  //     const address = req.params.address;
  //     const data = await UserService.getAccount(address)
  //     return res.send(data);

  // }
  // private queryAccounts = async (req: CustomRequest, res: Response, next: NextFunction) => {
  //     const filter = req.query as IUserFilter
  //     const data = await UserService.queryAccounts(filter)
  //     return res.send(data);
  // }
}

export default UserController
