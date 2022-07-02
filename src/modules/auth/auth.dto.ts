import { CodeType } from '@modules/verification_code/code.interface'
import { IsString, IsEmail, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator'

export class LogInDto {
    @IsEmail()
    public email: string

    @IsString()
    public password: string

    @IsOptional()
    public token: any
}
export class ForgotPasswordDto {
    // owner = email address | phone number
    @IsNotEmpty()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string
}

export class ResetPasswordDto {
    @IsString()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string

    @IsString()
    public code: string

    @IsString()
    public password: string

    @IsString()
    public pin: string
}

export class ForgotPinDto {
    // owner = email address | phone number
    @IsNotEmpty()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string
}

export class ResetPinDto {
    @IsString()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string

    @IsString()
    public code: string

    // current password
    @IsString()
    public password: string

    // new pin
    @IsString()
    public pin: string
}

export class RefreshTokenDto {
    @IsString()
    public refreshToken: string
}
