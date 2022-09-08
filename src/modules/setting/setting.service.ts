import SettingModel from '@modules/setting/setting.model'
import { SettingDto } from '@modules/setting/setting.dto'
import { DEFAULT_SETTING, SETTINGS_TYPE } from '@config/constants'
import { ISetting } from './setting.interface'

export default class SettingService {
    public static initGlobalSetting = async () => {
        const setting = await SettingModel.findOne({
            nav_key: SETTINGS_TYPE.global_federation_settings
        }).exec()
        if (setting) return
        await SettingModel.updateOne(
            {
                nav_key: SETTINGS_TYPE.global_federation_settings
            },
            {
                $set: {
                    registration_require_email_verified: DEFAULT_SETTING.registration_require_email_verified,
                    registration_require_phone_verified: DEFAULT_SETTING.registration_require_phone_verified,
                    login_require_mfa: DEFAULT_SETTING.login_require_mfa,
                    prime_transfer_fee: DEFAULT_SETTING.prime_transfer_fee,
                    withdraw_require_mfa: DEFAULT_SETTING.withdraw_require_mfa,
                    nft_trade_fee_rate: DEFAULT_SETTING.nft_trade_fee_rate
                }
            },
            {
                upsert: true
            }
        ).exec()
    }

    public static getGlobalSetting = async () => {
        const setting = await SettingModel.findOne({
            nav_key: SETTINGS_TYPE.global_federation_settings
        }).exec()
        return (setting || {
            ...DEFAULT_SETTING,
            nav_key: SETTINGS_TYPE.global_federation_settings
        }) as ISetting
    }

    public static getSettingByNavKey = async (navKey: string) => {
        const setting = await SettingModel.findOne<ISetting>({
            nav_key: navKey
        }).exec()
        return setting
    }

    public static updateSettingByNavKey = async (navKey: string, data: SettingDto) => {
        await SettingModel.updateOne(
            {
                nav_key: navKey
            },
            {
                $set: {
                    registration_require_email_verified: data.registration_require_email_verified,
                    registration_require_phone_verified: data.registration_require_phone_verified,
                    login_require_mfa: data.login_require_mfa,
                    prime_transfer_fee: data.prime_transfer_fee,
                    withdraw_require_mfa: data.withdraw_require_mfa,
                    nft_trade_fee_rate: data.nft_trade_fee_rate
                }
            },
            {
                upsert: true
            }
        ).exec()

        return { success: true }
    }
}
