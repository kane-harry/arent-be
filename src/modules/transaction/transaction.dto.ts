import { IsOptional, IsString, IsEmail, IsInt, ValidateNested } from 'class-validator';

export class CreateAccountDto {
    @IsString({ message: 'Wallet Symbol is required.' })
    public symbol: string;
}
