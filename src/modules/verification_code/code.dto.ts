import { map } from 'lodash'
import { IsString, IsEnum, IsOptional } from 'class-validator'
import { CodeType } from '@config/constants'

const verificationCodeSupported = [
    CodeType.EmailRegistration, //
    CodeType.PhoneRegistration,
    CodeType.EmailUpdate,
    CodeType.PhoneUpdate
]

export class CreateCodeDto {
    @IsString()
    @IsEnum(verificationCodeSupported, {
        message: `codeType must be one of ${map(verificationCodeSupported, el => el).join(' ')}`
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
    public owner: string
}
