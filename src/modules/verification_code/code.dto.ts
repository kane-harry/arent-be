import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator'
import { map } from 'lodash'
import { CodeType } from './code.interface'

export class CreateCodeDto {
    @IsString()
    @IsEnum(CodeType, {
        message: `codeType must be one of ${map(CodeType, el => el).join(' ')}`
    })
    public code_type: CodeType

    @IsString()
    public owner: string

    @IsOptional()
    public user_key?: string | undefined
}

export class VerifyCodeDto extends CreateCodeDto {
    @IsString()
    public code: string

    @IsString()
    @IsEnum(CodeType, {
        message: `codeType must be one of ${map(CodeType, el => el).join(' ')}`
    })
    public code_type: CodeType

    @IsString()
    public owner: string
}

export class SentCodeToEmailDto {
    @IsString()
    @IsEnum(CodeType, {
        message: `codeType must be one of ${map(CodeType, el => el).join(' ')}`
    })
    public code_type: CodeType

    @IsString()
    public owner: string

    @IsString()
    public code: string
}
