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

    @IsNotEmpty()
    public title: string

    @IsOptional()
    public description: string

    @IsOptional()
    public tags: string

    @IsNotEmpty()
    public price: string

    @IsOptional()
    public platform: string

    @IsOptional()
    public nft_token_id: string

    @IsOptional()
    public source: string

    @IsNotEmpty()
    public attributes: string

    @IsOptional()
    public image: object

    @IsOptional()
    public images: any[]
}
