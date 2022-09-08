import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator'

export class SettingDto {
    @IsNotEmpty()
    @IsBoolean()
    public registration_require_email_verified: boolean

    @IsNotEmpty()
    @IsBoolean()
    public registration_require_phone_verified: boolean

    @IsNotEmpty()
    @IsBoolean()
    public login_require_mfa: boolean

    @IsNotEmpty()
    @IsBoolean()
    public withdraw_require_mfa: boolean

    @IsNotEmpty()
    @IsPositive()
    @IsNumber({ allowNaN: false })
    public prime_transfer_fee: number

    @IsNotEmpty()
    @IsPositive()
    @IsNumber({ allowNaN: false })
    public nft_trade_fee_rate: number
}
