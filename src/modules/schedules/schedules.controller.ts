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
  Req,
  UseGuards,
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
import { OCRScheduleUploadDto } from './dto/ocr-schedule-upload.dto';
import { OCRTranscriptionService } from './OCR-transcription.service';
import { UpdateRecurringScheduleDto } from './dto/update-recurring-schedule.dto';
import { CreateRecurringScheduleDto } from './dto/create-recurring-schedule.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Schedules')
@UseGuards(AuthGuard('jwt'))
@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly ocrTranscriptionService: OCRTranscriptionService,
  ) {}

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

  @Post()
  @ApiOperation({
    summary: '새 일정 생성',
    description: '새로운 일정을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '일정이 성공적으로 생성됨',
    type: ResponseScheduleDto,
  })
  async createSchedule(
    @Req() req,
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    const userUuid = req.user.userUuid;
    createScheduleDto.userUuid = userUuid;
    createScheduleDto.categoryId = createScheduleDto.categoryId || 7;
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
  async deleteSchedule(@Param('id') id: number): Promise<void> {
    await this.schedulesService.remove(id);
  }
  @Get('date')
  @ApiOperation({ summary: '특정 날짜의 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getSchedulesByDate(
    @Query() weekQuery: WeekQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    return this.schedulesService.findByDate(weekQuery);
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
  async getScheduleById(@Param('id') id: number): Promise<ResponseScheduleDto> {
    return await this.schedulesService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: '사용자의 모든 일정 조회' })
  @ApiQuery({ name: 'userUuid', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getAllSchedulesByUserUuid(
    @Query('userUuid') userUuid: string,
  ): Promise<ResponseScheduleDto[]> {
    return this.schedulesService.findAllByUserUuid(userUuid);
  }

  @Post('upload/RTZR')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: '음성 파일 업로드 및 일정 추출' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VoiceScheduleUploadDto })
  @ApiResponse({
    status: 200,
    description: '추출된 일정 정보',
  })
  async uploadVoiceScheduleByRTZR(
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
    @Body('userUuid') userUuid: string,
  ): Promise<CreateScheduleDto[]> {
    return await this.schedulesService.transcribeRTZRAndFetchResultWithGpt(
      file,
      currentDateTime,
      userUuid,
    );
  }

  @Post('upload/Whisper')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: '음성 파일 업로드 및 일정 추출' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VoiceScheduleUploadDto })
  @ApiResponse({
    status: 200,
    description: '추출된 일정 정보',
  })
  async uploadVoiceScheduleByWhisper(
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
    @Body('userUuid') userUuid: string,
  ): Promise<CreateScheduleDto[]> {
    return await this.schedulesService.transcribeWhisperAndFetchResultWithGpt(
      file,
      currentDateTime,
      userUuid,
    );
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
  async uploadImageScheduleClova(
    @UploadedFile() file: Express.Multer.File,
    @Body('userUuid') userUuid: string,
  ): Promise<CreateScheduleDto[]> {
    const ocrResult =
      await this.ocrTranscriptionService.extractTextFromNaverOCR(file);
    return await this.schedulesService.processWithGptOCR(ocrResult);
  }

  @Post('recurring')
  @ApiOperation({
    summary: '새 반복 일정 생성',
    description: '새로운 반복 일정을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '반복 일정이 성공적으로 생성됨',
    type: ResponseScheduleDto,
  })
  async createRecurringSchedule(
    @Req() req,
    @Body() createRecurringScheduleDto: CreateRecurringScheduleDto,
  ): Promise<ResponseScheduleDto> {
    const userUuid = req.user.userUuid;
    createRecurringScheduleDto.userUuid = userUuid;
    createRecurringScheduleDto.categoryId =
      createRecurringScheduleDto.categoryId || 7;
    const schedule = await this.schedulesService.createRecurringSchedule(
      createRecurringScheduleDto,
    );
    return this.schedulesService.convertToResponseDto(
      schedule,
      schedule.category,
    );
  }

  @Patch('recurring/:id')
  @ApiOperation({
    summary: '반복 일정 업데이트',
    description: '기존 반복 일정을 업데이트합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '반복 일정이 성공적으로 업데이트됨',
    type: ResponseScheduleDto,
  })
  async updateRecurringSchedule(
    @Req() req,
    @Param('id') id: number,
    @Body() updateRecurringScheduleDto: UpdateRecurringScheduleDto,
    @Query('updateFuture') updateFuture: boolean,
  ): Promise<ResponseScheduleDto> {
    const userUuid = req.user.userUuid;
    const schedule = await this.schedulesService.updateRecurringSchedule(
      id,
      {
        ...updateRecurringScheduleDto,
        categoryId: updateRecurringScheduleDto.categoryId || 7,
      },
      updateFuture,
    );
    return this.schedulesService.convertToResponseDto(
      schedule,
      schedule.category,
    );
  }

  @Delete('recurring/:id')
  @ApiOperation({
    summary: '반복 일정 삭제',
    description: '지정된 ID의 반복 일정을 삭제합니다.',
  })
  @ApiResponse({ status: 204, description: '반복 일정이 성공적으로 삭제됨' })
  @ApiQuery({ name: 'deleteFuture', required: false, type: Boolean })
  async deleteRecurringSchedule(
    @Param('id') id: number,
    @Query('deleteFuture') deleteFuture: boolean = false,
  ): Promise<void> {
    await this.schedulesService.removeRecurring(id, deleteFuture);
  }
}
