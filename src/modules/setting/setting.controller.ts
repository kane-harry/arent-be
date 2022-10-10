import { Response } from 'express'
import { CustomRequest } from '@middlewares/request.middleware'
import SettingService from '@modules/setting/setting.service'
import { SettingDto } from '@modules/setting/setting.dto'

export default class SettingController {
    static async getSettingByNavKey(req: CustomRequest, res: Response) {
        const data = await SettingService.getSettingByNavKey(req.params.nav_key)
        return res.json(data)
    }

    static async updateSettingByNavKey(req: CustomRequest, res: Response) {
        const params: SettingDto = req.body
        const data = await SettingService.updateSettingByNavKey(req.params.nav_key, params)
        return res.json(data)
    }
}
