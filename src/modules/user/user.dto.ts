import { IsOptional, IsString, Length, IsEmail, MinLength, Matches } from 'class-validator'
import IFilterModel from '@interfaces/filter.model.interface'

export class CreateUserDto {
    @IsString()
    @Length(2, 20)
    public firstName: string

    @IsString()
    @Length(2, 20)
    public lastName: string

    // TODO: check uniq nickname
    @IsOptional()
    @Length(2, 20)
    public chatName: string

    @IsString()
    @IsEmail()
    public email: string

    @MinLength(6)
    @IsString()
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'password too weak' })
    public password: string

    @IsString()
    @Length(4, 4)
    public pin: string

    @IsOptional()
    public phone: string

    @IsOptional()
    public country: string

    @IsOptional()
    public playerId: string
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(2, 18)
    public firstName: string

    @IsOptional()
    @IsString()
    @Length(2, 18)
    public lastName: string

    // TODO: check uniq nickname
    @IsOptional()
    @IsString()
    @Length(2, 8)
    public chatName: string
}

export class SetupTotpDto {
    @IsString()
    @Length(6, 6)
    public token1: string

    @IsString()
    @Length(6, 6)
    public token2: string
}

export class UpdateSecurityDto {
    @IsString()
    public type: string

    @IsString()
    public loginEnabled: string

    @IsString()
    public withdrawEnabled: string

    @IsOptional()
    @IsString()
    public code: string
}

export class SetupCredentialsDto {
    @IsEmail()
    public email: string

    @IsString()
    public code: string

    @IsString()
    public pin: string

    @IsString()
    public password: string
}
