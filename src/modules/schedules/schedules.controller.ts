import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
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
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { SchedulesService } from './schedules.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ResponseScheduleDto } from './dto/response-schedule.dto';
import { DateRangeDto } from './dto/data-range-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceScheduleUploadDto } from './dto/voice-schedule-upload.dto';
import { OCRScheduleUploadDto } from './dto/\bocr-schedule-upload.dto';

@ApiTags('Schedules')
@Controller('schedules')
//@UseGuards(AuthGuard('jwt'))
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('range')
  @ApiOperation({ summary: '특정 날짜 범위의 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getSchedulesByDateRange(
    @Query() dateRange: DateRangeDto,
  ): Promise<ResponseScheduleDto[]> {
    return this.schedulesService.findByDateRange(dateRange);
  }

  @Post() // 추후 인증  @UseGuards(JwtAuthGuard), @ApiBearerAuth() 관련 설정이 필요함.
  @ApiOperation({
    summary: '새 일정 생성',
    description: '새로운 일정을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '일정이 성공적으로 생성됨',
    type: ResponseScheduleDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async createSchedule(
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    return await this.schedulesService.create(createScheduleDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '일정 업데이트',
    description: '기존 일정을 업데이트합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정이 성공적으로 업데이트됨',
    type: ResponseScheduleDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async updateSchedule(
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    return await this.schedulesService.update(id, updateScheduleDto);
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

  @Get('week')
  @ApiOperation({ summary: '특정 주의 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getSchedulesByWeek(
    @Query() weekQuery: WeekQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    console.log('getSchedulesByWeek called with:', weekQuery);
    return this.schedulesService.findByWeek(weekQuery);
  }

  @Get('month')
  @ApiOperation({ summary: '특정 월의 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getSchedulesByMonth(
    @Query() monthQuery: MonthQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    console.log('getSchedulesByMonth called with:', monthQuery);
    return this.schedulesService.findByMonth(monthQuery);
  }

  @Get(':id')
  @ApiOperation({
    summary: '일정 조회',
    description: '지정된 ID의 일정을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: ResponseScheduleDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async getScheduleById(@Param('id') id: number): Promise<ResponseScheduleDto> {
    return await this.schedulesService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: '사용자의 모든 일정 조회' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getAllSchedulesByUserId(
    @Query('userId') userId: number,
  ): Promise<ResponseScheduleDto[]> {
    return this.schedulesService.findAllByUserId(userId);
  }

  @Post('upload/RTZR')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: '음성 파일 업로드 및 일정 추출' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VoiceScheduleUploadDto })
  @ApiResponse({
    status: 200,
    description: '추출된 일정 정보',
    //type: [VoiceScheduleConfirmDto],
  })
  async uploadVoiceScheduleByRTZR(
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
  ): Promise<CreateScheduleDto[]> {
    // TranscriptionService를 사용하여 음성 파일 전사 및 처리
    const result =
      await this.schedulesService.transcribeRTZRAndFetchResultWithGpt(
        file,
        currentDateTime,
      );

    return result;
  }

  @Post('upload/Whisper')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: '음성 파일 업로드 및 일정 추출' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VoiceScheduleUploadDto })
  @ApiResponse({
    status: 200,
    description: '추출된 일정 정보',
    //type: [VoiceScheduleConfirmDto],
  })
  async uploadVoiceScheduleByWhisper(
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
  ): Promise<CreateScheduleDto[]> {
    // TranscriptionService를 사용하여 음성 파일 전사 및 처리
    const result =
      await this.schedulesService.transcribeWhisperAndFetchResultWithGpt(
        file,
        currentDateTime,
      );

    return result;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: '이미지 파일 업로드 및 일정 추출' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: OCRScheduleUploadDto })
  @ApiResponse({
    status: 200,
    description: '추출된 일정 정보',
    type: [CreateScheduleDto],
  })
  async uploadImageSchedule(
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
  ): Promise<CreateScheduleDto[]> {
    // OCRTranscriptionService를 사용하여 이미지 파일 OCR 처리 및 일정 추출
    const result =
      await this.schedulesService.transcribeOCRAndFetchResultWithGpt(
        file,
        currentDateTime,
      );

    return result;
  }
}
