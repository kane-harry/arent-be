import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator'

export class ImportNftDto {
    @IsNotEmpty()
    public contract_address: string

    @IsNotEmpty()
    public token_id: string

    @IsOptional()
    public type: string

    // ethereum, polygon
    @IsNotEmpty()
    public platform: string

    // admin can import nfts for user, if not admin and no user_key, get user key from token
    @IsOptional()
    public user_key: string
}

export class CreateNftDto {
    @IsNotEmpty()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public collection_key: string

    @IsNotEmpty()
    public price: string

    @IsOptional()
    public attributes: string

    @IsOptional()
    public meta_data: string

    @IsOptional()
    public animation: any

    @IsNotEmpty()
    public image: any

    @IsNotEmpty()
    public type: string

    @IsNotEmpty()
    public num_sales: string
}

export class UpdateNftDto {
    @IsOptional()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public price: string

    @IsOptional()
    public attributes: string

    @IsOptional()
    public meta_data: string

    @IsOptional()
    public collection_key: string

    @IsOptional()
    public animation: any

    @IsOptional()
    public image: any
}

export class UpdateNftStatusDto {
    @IsNotEmpty()
    public status: string
}
