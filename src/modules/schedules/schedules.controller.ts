import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { SchedulesService } from './schedules.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleResponseDto } from './dto/response-schedule.dto';
import { DateRangeDto } from './dto/data-range-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  VoiceScheduleConfirmDto,
  VoiceScheduleUploadDto,
} from './dto/voice-schedule.dto';

@ApiTags('Schedules')
@Controller('schedules')
@UseGuards(AuthGuard('jwt'))
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('range')
  @ApiOperation({ summary: '특정 날짜 범위의 일정 조회' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ScheduleResponseDto],
  })
  async getSchedulesByDateRange(
    @Query('userId') userId: number,
    @Query() dateRange: DateRangeDto,
  ): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findByDateRange(userId, dateRange);
  }

  @Post() // 추후 인증  @UseGuards(JwtAuthGuard), @ApiBearerAuth() 관련 설정이 필요함.
  @ApiOperation({
    summary: '새 일정 생성',
    description: '새로운 일정을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '일정이 성공적으로 생성됨',
    type: ScheduleResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async createSchedule(
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    const schedule = await this.schedulesService.create(createScheduleDto);
    return new ScheduleResponseDto(schedule);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '일정 업데이트',
    description: '기존 일정을 업데이트합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정이 성공적으로 업데이트됨',
    type: ScheduleResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async updateSchedule(
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    const schedule = await this.schedulesService.update(id, updateScheduleDto);
    return new ScheduleResponseDto(schedule);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '일정 삭제',
    description: '지정된 ID의 일정을 삭제합니다.',
  })
  @ApiResponse({ status: 204, description: '일정이 성공적으로 삭제됨' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async deleteSchedule(@Param('id') id: number): Promise<void> {
    await this.schedulesService.remove(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: '일정 조회',
    description: '지정된 ID의 일정을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: ScheduleResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async getScheduleById(@Param('id') id: number): Promise<ScheduleResponseDto> {
    const schedule = await this.schedulesService.findOne(id);
    return new ScheduleResponseDto(schedule);
  }

  @Get()
  @ApiOperation({ summary: '사용자의 모든 일정 조회' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ScheduleResponseDto],
  })
  async getAllSchedulesByUserId(
    @Query('userId') userId: number,
  ): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findAllByUserId(userId);
  }

  @Get('month')
  @ApiOperation({ summary: '특정 월의 일정 조회' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ScheduleResponseDto],
  })
  async getSchedulesByMonth(
    @Query('userId') userId: number,
    @Query() monthQuery: MonthQueryDto,
  ): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findByMonth(userId, monthQuery);
  }

  @Get('week')
  @ApiOperation({ summary: '주 단위 일정 조회' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ScheduleResponseDto],
  })
  async getSchedulesByWeek(
    @Query('userId') userId: number,
    @Query() weekQuery: WeekQueryDto,
  ): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findByWeek(userId, weekQuery);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: '음성 파일 업로드 및 일정 추출' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VoiceScheduleUploadDto })
  @ApiResponse({
    status: 200,
    description: '추출된 일정 정보',
    type: [VoiceScheduleConfirmDto],
  })
  async uploadVoiceSchedule(
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
  ) {
    return await this.schedulesService.processVoiceSchedule(
      file.buffer,
      currentDateTime,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: '추출된 일정 확인 및 저장' })
  @ApiBody({ type: [VoiceScheduleConfirmDto] })
  @ApiResponse({
    status: 201,
    description: '저장된 일정 정보',
    type: [ScheduleResponseDto],
  })
  async confirmSchedule(@Body() scheduleData: VoiceScheduleConfirmDto[]) {
    return await this.schedulesService.confirmAndSaveSchedule(scheduleData);
  }
}
