import { IsString, IsEmail, IsOptional } from 'class-validator'

export class LogInDto {
    @IsEmail()
    public email: string

    @IsString()
    public password: string

    @IsOptional()
    @IsString()
    public token: string
}

export class ResetPasswordDto {
    @IsString()
    public oldPassword: string

    @IsString()
    public newPassword: string

    @IsString()
    public newPasswordConfirmation: string
}

export class ForgotPasswordDto {
    @IsString()
    @IsEmail()
    public email: string

    @IsString()
    public code: string

    @IsString()
    public newPassword: string
}

export class ResetPinDto {
    @IsString()
    public oldPin: string

    @IsString()
    public newPin: string

    @IsString()
    public newPinConfirmation: string
}

export class ForgotPinDto {
    @IsString()
    @IsEmail()
    public email: string

    @IsString()
    public code: string

    @IsString()
    public newPin: string
}

export class RefreshTokenDto {
    @IsString()
    public refreshToken: string
}
