import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import {
  SignUpDto,
  SignInDto,
  TokenResponseDto,
  MessageResponseDto,
  SignUpResponseDto,
  UserResponseDto,
} from './dto/auth.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { extractTokenFromHeader } from './utils/extract-token.util';
import { RolesService } from '../roles/roles.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private rolesService: RolesService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      'Create a new user account with email, password, and optional role.',
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: SignUpResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async signUp(@Body() signUpDto: SignUpDto): Promise<SignUpResponseDto> {
    const user = await this.authService.signUp(
      signUpDto.username,
      signUpDto.password,
      signUpDto.role,
    );

    return {
      message: 'User successfully created',
      user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Log in a user',
    description: 'Authenticate a user and return a JWT token.',
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async signIn(@Body() signInDto: SignInDto): Promise<TokenResponseDto> {
    const token = await this.authService.signIn(
      signInDto.username,
      signInDto.password,
    );
    return { token };
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve the profile of the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getProfile(@Request() req): Promise<UserResponseDto> {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.authService.getUserProfile(req.user._id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out a user',
    description:
      "Invalidate the user's JWT token, effectively logging them out.",
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async logout(@Request() req): Promise<MessageResponseDto> {
    const token = extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.authService.logout(token);

    return { message: 'Logout successful' };
  }
}
