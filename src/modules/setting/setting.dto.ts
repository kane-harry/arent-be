import { IsOptional } from 'class-validator'

export class SettingDto {
    @IsOptional()
    public registration_require_email_verified: boolean

    @IsOptional()
    public registration_require_phone_verified: boolean

    @IsOptional()
    public login_require_mfa: boolean

    @IsOptional()
    public withdraw_require_mfa: boolean

    @IsOptional()
    public prime_transfer_fee: number
}
