import { IsString, IsOptional } from 'class-validator'

export class SendPrimeCoinsDto {
    @IsString({ message: 'Symbol is required.' })
    public symbol: string

    @IsString({ message: 'Sender address is required.' })
    public sender: string

    @IsString({ message: 'Recipient address is required.' })
    public recipient: string

    @IsString({ message: 'Send amount is required.' })
    public amount: string

    @IsOptional()
    public notes: string

    @IsOptional()
    public mode: string
}
