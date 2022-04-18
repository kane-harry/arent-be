import { IsString, IsOptional } from 'class-validator'

export class CreateRawWalletDto {
    @IsString({ message: 'Symbol is required.' })
    public symbol: string
}

export class CreateSignatureDto {
    @IsString({ message: 'Symbol is required.' })
    public symbol: string

    @IsString({ message: 'Sender address is required.' })
    public sender: string

    @IsString({ message: 'Recipient address is required.' })
    public recipient: string

    @IsString({ message: 'Send amount is required.' })
    public amount: string

    @IsString({ message: 'privateKey is required.' })
    public privateKey: string

    @IsString({ message: 'nonce is required.' })
    public nonce: string

    @IsOptional()
    public notes: string
}

export class SendRawDto {
    @IsString({ message: 'Symbol is required.' })
    public symbol: string

    @IsString({ message: 'Sender address is required.' })
    public sender: string

    @IsString({ message: 'Recipient address is required.' })
    public recipient: string

    @IsString({ message: 'Send amount is required.' })
    public amount: string

    @IsString({ message: 'nonce is required.' })
    public nonce: string

    @IsString({ message: 'signature is required.' })
    public signature: string

    @IsOptional()
    public notes: string
}
