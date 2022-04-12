import asyncHandler from '../../common/asyncHandler'
import { Router, Request, Response, NextFunction } from 'express'
import IController from '../../interfaces/controller.interface'
import validationMiddleware from '../../middlewares/validation.middleware'
import AuthService from './auth.service'
import { CreateUserDto } from '../user/user.dto'
import LogInDto from './login.dto'
import { requireAuth } from '../../common/authCheck'

export default class AuthController implements IController {
  public path = '/auth'
  public router = Router()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), asyncHandler(this.register))
    this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), asyncHandler(this.logIn))
    this.router.post(`${this.path}/logout`, requireAuth, asyncHandler(this.logOut))
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    const userData: CreateUserDto = req.body
    const data = await AuthService.register(userData)

    return res.send(data)
  }

  private logIn = async (req: Request, res: Response, next: NextFunction) => {
    const logInData: LogInDto = req.body
    const data = await AuthService.logIn(logInData)

    return res.send(data)
  }

  private logOut = async (req: Request, res: Response) => {
    // const postData: any = req.body;
    // const data = await AuthService.logOut(postData)

    return res.send(req.user)
  }
}
