import { IsString, IsEmail } from 'class-validator'

export class LogInDto {
    @IsEmail()
    public email: string

    @IsString()
    public password: string
}
