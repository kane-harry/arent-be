import { IsString, IsEmail, IsEnum } from 'class-validator'
import { map } from 'lodash'
import { CodeType } from './code.interface'

export class CreateCodeDto {
    @IsString()
    @IsEnum(CodeType, {
        message: `codeType must be one of ${map(CodeType, el => el).join(' ')}`
    })
    public codeType: CodeType

    @IsString()
    @IsEmail()
    public email: string
}

export class VerifyCodeDto extends CreateCodeDto {
    @IsString()
    public code: string
}
