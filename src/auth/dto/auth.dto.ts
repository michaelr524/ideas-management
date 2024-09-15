import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "The user's email address",
  })
  @IsEmail()
  username: string;

  @ApiProperty({ example: 'password123', description: "The user's password" })
  @IsString()
  password: string;

  @ApiProperty({
    example: ['user'],
    description: "The user's roles",
    required: false,
    type: [String],
  })
  @IsString()
  @IsOptional()
  role?: string;
}

export class SignInDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "The user's email address",
  })
  @IsEmail()
  username: string;

  @ApiProperty({ example: 'password123', description: "The user's password" })
  @IsString()
  password: string;
}

export class TokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  @IsString()
  token: string;
}

export class MessageResponseDto {
  @ApiProperty({
    example: 'Operation successful',
    description: 'A message describing the result of the operation',
  })
  @IsString()
  message: string;
}

export class UserResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: "The user's unique identifier",
  })
  @IsString()
  _id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: "The user's email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: "The user's name",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: ['user', 'admin'],
    description: "The user's roles",
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];
}

export class SignUpResponseDto {
  @ApiProperty({
    example: 'User successfully created',
    description: 'A message describing the result of the sign-up operation',
  })
  @IsString()
  message: string;

  @ApiProperty({ description: "The created user's information" })
  user: UserResponseDto;
}
