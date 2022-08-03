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
