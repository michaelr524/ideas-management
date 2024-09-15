import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class IdeaDto {
  @ApiProperty({ description: 'The unique identifier of the idea' })
  @IsString()
  @IsNotEmpty()
  _id: string;

  @ApiProperty({ description: 'The title of the idea' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The description of the idea' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'The creator of the idea' })
  @IsString()
  @IsNotEmpty()
  creator: string;

  @ApiProperty({ description: 'The creation date of the idea' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the idea' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class CreateIdeaDto {
  @ApiProperty({ description: 'The title of the idea' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The description of the idea' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateIdeaDto {
  @ApiProperty({
    description: 'The updated title of the idea',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'The updated description of the idea',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class IdeasResponseDto {
  @ApiProperty({ description: 'Response message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Array of ideas', type: [IdeaDto] })
  ideas: IdeaDto[];
}

export class IdeaResponseDto {
  @ApiProperty({ description: 'Response message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'The idea object', type: IdeaDto })
  idea: IdeaDto;
}
