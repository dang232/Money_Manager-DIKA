// ponytail: category REST controller
import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UserId } from '@money-manager/shared-kernel';
import { CreateCategoryHandler } from '../../application/handlers/create-category.handler';
import { UpdateCategoryHandler } from '../../application/handlers/update-category.handler';
import { DeleteCategoryHandler } from '../../application/handlers/delete-category.handler';
import { GetCategoriesHandler } from '../../application/handlers/get-categories.handler';
import { CreateCategoryCommand } from '../../application/commands/create-category.command';
import { UpdateCategoryCommand } from '../../application/commands/update-category.command';
import { DeleteCategoryCommand } from '../../application/commands/delete-category.command';
import { GetCategoriesQuery } from '../../application/queries/get-categories.query';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from '../dtos/category.dto';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createHandler: CreateCategoryHandler,
    private readonly updateHandler: UpdateCategoryHandler,
    private readonly deleteHandler: DeleteCategoryHandler,
    private readonly getHandler: GetCategoriesHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const userId = UserId.DEFAULT.value;
    const category = await this.createHandler.execute(
      new CreateCategoryCommand(userId, dto.name, dto.type, dto.icon, dto.color),
    );
    return this.toResponse(category);
  }

  @Get()
  async findAll(): Promise<CategoryResponseDto[]> {
    const userId = UserId.DEFAULT.value;
    const categories = await this.getHandler.execute(new GetCategoriesQuery(userId));
    return categories.map((c) => this.toResponse(c));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const userId = UserId.DEFAULT.value;
    const category = await this.updateHandler.execute(
      new UpdateCategoryCommand(id, userId, dto.name, dto.icon, dto.color),
    );
    return this.toResponse(category);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const userId = UserId.DEFAULT.value;
    await this.deleteHandler.execute(new DeleteCategoryCommand(id, userId));
  }

  private toResponse(category: { id: string; name: string; type: string; icon: string; color: string; createdAt: Date }): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      createdAt: category.createdAt.toISOString(),
    };
  }
}
