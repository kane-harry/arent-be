import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator'

export class SettingDto {
    @IsNotEmpty()
    public registration_require_email_verified: string

    @IsNotEmpty()
    public registration_require_phone_verified: string

    @IsNotEmpty()
    public login_require_mfa: string

    @IsNotEmpty()
    public withdraw_require_mfa: string

    @IsNotEmpty()
    public prime_transfer_fee: string

    @IsNotEmpty()
    public nft_commission_fee_rate: string
}
