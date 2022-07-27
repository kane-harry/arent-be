import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator'

export class ImportProductDto {
    @IsNotEmpty()
    public contract_address: string

    @IsNotEmpty()
    public token_id: string

    @IsOptional()
    public type: string

    @IsNotEmpty()
    public platform: string
}

export class CreateProductDto {
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
    public source: string

    @IsNotEmpty()
    public image: string

    @IsNotEmpty()
    public attributes: string
}
