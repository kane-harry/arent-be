import { map } from 'lodash'
import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator'
import { CODE_TYPE } from '@config/constants'

const verificationCodeSupported = [
    CODE_TYPE.EmailRegistration, //
    CODE_TYPE.PhoneRegistration,
    CODE_TYPE.EmailUpdate,
    CODE_TYPE.PhoneUpdate
]

export class CreateCodeDto {
    @IsString()
    @IsEnum(verificationCodeSupported, {
        message: `codeType must be one of ${map(verificationCodeSupported, el => el).join(' ')}`
    })
    public code_type: CODE_TYPE

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
