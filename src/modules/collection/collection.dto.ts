import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateCollectionDto {
    @IsNotEmpty()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public logo: string

    @IsOptional()
    public background: string
}

export class UpdateCollectionDto {
    @IsNotEmpty()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public logo: string

    @IsOptional()
    public background: string

    @IsOptional()
    public owner: string
}

export class AssignCollectionDto {
    public user_key: string
}
