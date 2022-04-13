import { IsString, IsEmail } from 'class-validator'

export class LogInDto {
    @IsEmail()
    public email: string

    @IsString()
    public password: string
}

export class PasswordResetDto {
    @IsString()
    public oldPassword: string

    @IsString()
    public newPassword: string

    @IsString()
    public newPasswordConfirmation: string
}
