import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator'

export class LogInDto {
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    public email: string

    @IsString()
    @IsNotEmpty()
    public password: string

    @IsOptional()
    public token?: string

    @IsOptional()
    public player_id?: string
}
