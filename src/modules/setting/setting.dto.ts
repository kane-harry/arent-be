import { IsOptional } from 'class-validator'

export class SettingDto {
    @IsOptional()
    public registrationRequireEmailVerified: boolean

    @IsOptional()
    public registrationRequirePhoneVerified: boolean

    @IsOptional()
    public loginRequireMFA: boolean

    @IsOptional()
    public withdrawRequireMFA: boolean

    @IsOptional()
    public primeTransferFee: number
}
