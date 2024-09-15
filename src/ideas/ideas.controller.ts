import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IdeasService } from './ideas.service';
import {
  CreateIdeaDto,
  UpdateIdeaDto,
  IdeasResponseDto,
  IdeaResponseDto,
  IdeaDto,
} from './dto/idea.dto';
import { Idea } from './schemas/idea.schema';

@ApiTags('ideas')
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  private mapIdeaToDto(idea: Idea): IdeaDto {
    return {
      _id: idea._id,
      title: idea.title,
      description: idea.description,
      creator: idea.creator._id,
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
    };
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new idea' })
  @ApiBody({ type: CreateIdeaDto })
  @ApiResponse({
    status: 201,
    description: 'The idea has been successfully created.',
    type: IdeaResponseDto,
  })
  async create(
    @Request() req,
    @Body() createIdeaDto: CreateIdeaDto,
  ): Promise<IdeaResponseDto> {
    const idea = await this.ideasService.create(
      createIdeaDto.title,
      createIdeaDto.description,
      req.user,
    );
    return {
      message: 'Idea created successfully',
      idea: this.mapIdeaToDto(idea),
    };
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ideas for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Return all ideas.',
    type: IdeasResponseDto,
  })
  async findAll(@Request() req): Promise<IdeasResponseDto> {
    const ideas = await this.ideasService.findAll(req.user);
    return {
      message: 'Ideas retrieved successfully',
      ideas: ideas.map((idea) => this.mapIdeaToDto(idea)),
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific idea by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Return the idea.',
    type: IdeaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async findOne(
    @Request() req,
    @Param('id') id: string,
  ): Promise<IdeaResponseDto> {
    const idea = await this.ideasService.findOne(id, req.user);
    return {
      message: 'Idea retrieved successfully',
      idea: this.mapIdeaToDto(idea),
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an idea' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateIdeaDto })
  @ApiResponse({
    status: 200,
    description: 'The idea has been successfully updated.',
    type: IdeaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateIdeaDto: UpdateIdeaDto,
  ): Promise<IdeaResponseDto> {
    const idea = await this.ideasService.update(id, updateIdeaDto, req.user);
    return {
      message: 'Idea updated successfully',
      idea: this.mapIdeaToDto(idea),
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an idea' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'The idea has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async remove(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.ideasService.remove(id, req.user);
    return { message: 'Idea deleted successfully' };
  }
}
