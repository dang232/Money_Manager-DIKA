// ponytail: category REST controller
import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UserId, ApiResponse, CurrentUser } from '@money-manager/shared-kernel';
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
  async create(@CurrentUser() userId: UserId, @Body() dto: CreateCategoryDto) {
    const category = await this.createHandler.execute(
      new CreateCategoryCommand(userId.value, dto.name, dto.type, dto.icon, dto.color),
    );
    return ApiResponse.ok(this.toResponse(category));
  }

  @Get()
  async findAll(@CurrentUser() userId: UserId) {
    const categories = await this.getHandler.execute(new GetCategoriesQuery(userId.value));
    return ApiResponse.ok(categories.map((c) => this.toResponse(c)));
  }

  @Put(':id')
  async update(@CurrentUser() userId: UserId, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.updateHandler.execute(
      new UpdateCategoryCommand(id, userId.value, dto.name, dto.icon, dto.color),
    );
    return ApiResponse.ok(this.toResponse(category));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() userId: UserId, @Param('id') id: string): Promise<void> {
    await this.deleteHandler.execute(new DeleteCategoryCommand(id, userId.value));
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
