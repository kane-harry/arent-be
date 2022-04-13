import { IsString, IsEmail } from 'class-validator'

export class CreateCodeDto {
    @IsString()
    public codeType: string

    @IsString()
    @IsEmail()
    public email: string
}
export class VerifyCodeDto {
    @IsString()
    public codeType: string

    @IsString()
    @IsEmail()
    public email: string

    @IsString()
    public code: string
}

export class LogInDto {
    @IsEmail()
    public email: string

    @IsString()
    public password: string
}
