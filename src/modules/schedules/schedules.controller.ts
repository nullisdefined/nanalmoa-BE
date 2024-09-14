import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Schedules')
@Controller('schedules')
@UseGuards(AuthGuard('jwt'))
export class SchedulesController {
  @Get()
  @ApiOperation({ summary: '사용자 일정 조회' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    description: '시작 날짜 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    description: '종료 날짜 (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: '일정 목록 반환' })
  async getUserSchedules(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // 현재 로그인된 사용자의 일정 조회 로직
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 일정 조회' })
  @ApiParam({ name: 'id', type: 'number', description: '일정 ID' })
  @ApiResponse({ status: 200, description: '일정 정보 반환' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async getScheduleById(@Param('id') id: number) {
    // 특정 일정 조회 로직
  }

  @Post()
  @ApiOperation({ summary: '새 일정 생성' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'number', description: '카테고리 ID' },
        startDate: {
          type: 'string',
          format: 'date-time',
          description: '시작 날짜 및 시간',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: '종료 날짜 및 시간',
        },
        title: { type: 'string', description: '일정 제목' },
        place: { type: 'string', description: '장소' },
        memo: { type: 'string', description: '메모' },
        isGroupSchedule: { type: 'boolean', description: '그룹 일정 여부' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '일정 생성 성공' })
  async createSchedule(@Body() createScheduleDto: any) {
    // 새 일정 생성 로직
  }

  @Put(':id')
  @ApiOperation({ summary: '일정 수정' })
  @ApiParam({ name: 'id', type: 'number', description: '수정할 일정 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'number', description: '카테고리 ID' },
        startDate: {
          type: 'string',
          format: 'date-time',
          description: '시작 날짜 및 시간',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: '종료 날짜 및 시간',
        },
        title: { type: 'string', description: '일정 제목' },
        place: { type: 'string', description: '장소' },
        memo: { type: 'string', description: '메모' },
        isGroupSchedule: { type: 'boolean', description: '그룹 일정 여부' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '일정 수정 성공' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async updateSchedule(
    @Param('id') id: number,
    @Body() updateScheduleDto: any,
  ) {
    // 일정 수정 로직
  }

  @Delete(':id')
  @ApiOperation({ summary: '일정 삭제' })
  @ApiParam({ name: 'id', type: 'number', description: '삭제할 일정 ID' })
  @ApiResponse({ status: 200, description: '일정 삭제 성공' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async deleteSchedule(@Param('id') id: number) {
    // 일정 삭제 로직
  }
}
