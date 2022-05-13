import asyncHandler from '@common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { CustomRequest } from '@middlewares/request.middleware'
import AdminService from './admin.service'
import { requireAdmin } from '@config/role'
import { LockUserDto } from '@modules/admin/admin.dto'
import {requireAuth} from "@common/authCheck";

class AdminController implements IController {
    public path = '/admin'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}/user/lock`, requireAuth, requireAdmin(), asyncHandler(this.lockUser))
    }

    private async lockUser(req: CustomRequest, res: Response) {
        const params: LockUserDto = req.body
        const data = await AdminService.lockUser(params)
        return res.json(data)
    }
}

export default AdminController
