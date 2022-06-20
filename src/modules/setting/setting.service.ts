import SettingModel from '@modules/setting/setting.model'
import { SettingDto } from '@modules/setting/setting.dto'
import { defaultSetting } from '@modules/setting/setting.interface'

export default class SettingService {
    public static getGlobalSetting = async () => {
        const setting = await SettingModel.findOne({}).exec()
        return setting ?? (await SettingService.newGlobalSetting(defaultSetting))
    }

    public static newGlobalSetting = async (params: SettingDto) => {
        const existSetting = await SettingModel.findOne({}).exec()
        if (existSetting) {
            return existSetting
        }
        const setting = new SettingModel(params)
        const savedData = await setting.save()
        return savedData
    }

    public static updateGlobalSetting = async (data: object) => {
        let setting = await SettingModel.findOne({}).exec()
        if (!setting) {
            await SettingService.newGlobalSetting(defaultSetting)
        }
        setting = await SettingModel.findOne({}).exec()
        if (!setting) {
            return
        }
        const keys = Object.keys(data)
        for (const index in keys) {
            const field = keys[index]
            // @ts-ignore
            setting.set(field, data[field])
        }
        await setting.save()

        return setting
    }
}
