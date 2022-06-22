import { IsString, IsOptional } from 'class-validator'

export class DepositDto {
    public depositType: string
    public type: string
    public pin: string
    public amount: any
    public accountKey: string
    public cardToken: string

    @IsOptional()
    public user: any

    @IsOptional()
    public account: any

    @IsOptional()
    public setting: any

    @IsOptional()
    public ipAddress: any
}
