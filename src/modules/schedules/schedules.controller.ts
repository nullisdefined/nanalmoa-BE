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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { SchedulesService } from './schedules.service';
import { ResponseScheduleDto } from './dto/response-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceScheduleUploadDto } from './dto/voice-schedule-upload.dto';
import { OCRScheduleUploadDto } from './dto/ocr-schedule-upload.dto';
import { OCRTranscriptionService } from './OCR-transcription.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiTags('Schedules')
@UseGuards(AuthGuard('jwt'))
@Controller('schedules')
@ApiBearerAuth('Access-Token')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly ocrTranscriptionService: OCRTranscriptionService,
  ) {}

  @Get('range')
  @ApiOperation({ summary: '특정 날짜 범위의 일정 조회' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: '시작 날짜 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: '종료 날짜 (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getSchedulesByDateRange(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ResponseScheduleDto[]> {
    const userUuid = req.user.userUuid;
    return this.schedulesService.getSchedulesInRange(
      userUuid,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get()
  @ApiOperation({
    summary: '사용자의 모든 일정 조회',
    description: '사용자의 반복 일정을 포함한 전후 1년의 일정을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getAllSchedulesByUserUuid(@Req() req): Promise<ResponseScheduleDto[]> {
    const userUuid = req.user.userUuid;
    return this.schedulesService.findAllByUserUuid(userUuid);
  }

  @Post()
  @ApiOperation({
    summary: '새 일정 생성 (일반 및 반복)',
    description: '새로운 일정을 생성합니다. 반복 일정도 이 API를 사용합니다.',
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
    return await this.schedulesService.createSchedule(
      userUuid,
      createScheduleDto,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: '일정 수정',
    description: '기존 일정을 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정이 성공적으로 수정됨',
    type: ResponseScheduleDto,
  })
  async updateSchedule(
    @Req() req,
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    const userUuid = req.user.userUuid;
    updateScheduleDto.categoryId = updateScheduleDto.categoryId || 7;
    return await this.schedulesService.updateSchedule(
      userUuid,
      id,
      updateScheduleDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '일정 삭제' })
  @ApiQuery({
    name: 'instanceDate',
    required: true,
    type: String,
    description: '삭제할 인스턴스의 날짜 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'deleteFuture',
    required: false,
    type: Boolean,
    description: '이후 모든 일정 삭제 여부',
  })
  async deleteSchedule(
    @Req() req,
    @Param('id') id: number,
    @Query('instanceDate') instanceDate: string,
    @Query('deleteFuture') deleteFuture: boolean,
  ): Promise<void> {
    const userUuid = req.user.userUuid;
    await this.schedulesService.deleteSchedule(
      userUuid,
      id,
      instanceDate,
      deleteFuture,
    );
  }

  @Get('week')
  @ApiOperation({ summary: '특정 주의 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getSchedulesByWeek(
    @Req() req,
    @Query() weekQuery: WeekQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    const userUuid = req.user.userUuid;
    return this.schedulesService.findByWeek(userUuid, weekQuery);
  }

  @Get('month')
  @ApiOperation({ summary: '특정 월의 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  async getSchedulesByMonth(
    @Req() req,
    @Query() monthQuery: MonthQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    const userUuid = req.user.userUuid;
    return this.schedulesService.findByMonth(userUuid, monthQuery);
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
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
  ): Promise<CreateScheduleDto[]> {
    const userUuid = req.user.userUuid;
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
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('currentDateTime') currentDateTime: string,
  ): Promise<CreateScheduleDto[]> {
    const userUuid = req.user.userUuid;
    return await this.schedulesService.transcribeWhisperAndFetchResultWithGpt(
      file,
      currentDateTime,
      userUuid,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: '이미지 파일 업로드 및 복약 일정 추출' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: OCRScheduleUploadDto })
  @ApiResponse({
    status: 200,
    description: '추출된 복약 정보 및 생성된 일정',
    type: [CreateScheduleDto],
  })
  async uploadImageScheduleClova(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ): Promise<CreateScheduleDto[]> {
    const userUuid = req.user.userUuid;
    const schedules = await this.ocrTranscriptionService.processMedicationImage(
      file,
      userUuid,
    );
    return schedules;
  }
}
