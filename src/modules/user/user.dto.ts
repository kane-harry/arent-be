import { IsOptional, IsString, Length } from 'class-validator'
import IFilterModel from "@interfaces/filter.model.interface";

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
    public email: string

    @IsString()
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
