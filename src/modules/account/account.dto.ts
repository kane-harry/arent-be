import { IsString, IsNumber, Min } from 'class-validator'

export class WithdrawDto {
    @IsString({ message: 'Destination address is required.' })
    public address: string

    @IsNumber({ allowNaN: false, maxDecimalPlaces: 8 }, { message: 'amount should be a decimal with max 8 decimal places.' })
    @Min(0.001)
    public amount: string
}
