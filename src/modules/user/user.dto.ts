import { IsOptional, IsString, Length, IsEmail, MinLength, Matches } from 'class-validator'
import IFilterModel from '@interfaces/filter.model.interface'

export class CreateUserDto {
    @IsString()
    @Length(2, 8)
    public firstName: string

    @IsString()
    @Length(2, 8)
    public lastName: string

    // TODO: check uniq nickname
    @IsString()
    @Length(2, 8)
    public nickName: string

    @IsString()
    @IsEmail()
    public email: string

    @MinLength(6)
    @IsString()
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})
    public password: string

    @IsString()
    @Length(4, 4)
    public pin: string

    // TODO: check phone
    @IsOptional()
    public phone: string

    @IsOptional()
    public country: string

    @IsOptional()
    public playerId: string
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @Length(2, 8)
    public firstName: string

    @IsOptional()
    @IsString()
    @Length(2, 8)
    public lastName: string

    // TODO: check uniq nickname
    @IsOptional()
    @IsString()
    @Length(2, 8)
    public nickName: string

    // TODO: check phone
    @IsOptional()
    public phone: string

    @IsOptional()
    public country: string

    @IsOptional()
    public playerId: string
}

export class Update2FAUserDto {
    @IsString()
    public twoFactorEnable: string

    @IsString()
    public token: string
}

export interface GetUserListDto extends IFilterModel {
    type: string
    status: string
    terms: string
    datefrom: string
    dateto: string
    sortby: string
    orderby: string
}
