import { IsString, IsNumber, IsOptional } from 'class-validator'

export class MintDto {
    // @IsNumber({ allowNaN: false, maxDecimalPlaces: 8 }, { message: 'amount should be a decimal with max 8 decimal places.' })
    public amount: string

    @IsOptional()
    public notes?: string

    @IsOptional()
    public type?: string
}

export class WithdrawDto {
    @IsString({ message: 'Destination address is required.' })
    public address: string

    @IsNumber({ allowNaN: false, maxDecimalPlaces: 8 }, { message: 'amount should be a decimal with max 8 decimal places.' })
    public amount: string

    public token: string
}
