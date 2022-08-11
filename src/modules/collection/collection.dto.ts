import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateCollectionDto {
    @IsNotEmpty()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public logo: object

    @IsOptional()
    public background: object
}

export class UpdateCollectionDto {
    @IsNotEmpty()
    public name: string

    @IsOptional()
    public description: string

    @IsOptional()
    public logo: object

    @IsOptional()
    public background: object

    @IsOptional()
    public owner: string
}

export class AssignCollectionDto {
    public user_key: string
}
