import { IsString, IsEmail } from 'class-validator'

export class CreateCodeDto {
    @IsString()
    public codeType: string

    @IsString()
    @IsEmail()
    public email: string
}

export class VerifyCodeDto extends CreateCodeDto {
    @IsString()
    public code: string
}
