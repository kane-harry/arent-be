import { IsString, IsEmail, IsOptional } from 'class-validator'

export class LogInDto {
    @IsEmail()
    public email: string

    @IsString()
    public password: string

    @IsOptional()
    public token: any
}
