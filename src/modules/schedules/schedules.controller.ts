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
  ApiParam,
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

  @Get('day')
  @ApiOperation({ summary: '특정 일의 일정 조회' })
  @ApiQuery({
    name: 'userUuid',
    required: false,
    type: String,
    description: '사용자의 UUID',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: '조회할 날짜 (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '유효하지 않은 날짜 형식입니다.',
        },
      },
    },
  })
  async getSchedulesByDate(
    @Req() req,
    @Query('date') date: string,
    @Query('userUuid') queryUserUuid?: string,
  ): Promise<ResponseScheduleDto[]> {
    const userUuid = queryUserUuid || req.user.userUuid;
    return this.schedulesService.findByDate(userUuid, {
      userUuid,
      date: new Date(date),
    });
  }

  @Get('week')
  @ApiOperation({ summary: '특정 주의 일정 조회' })
  @ApiQuery({
    name: 'userUuid',
    required: false,
    type: String,
    description: '사용자의 UUID',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: '조회할 주 날짜 (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '유효하지 않은 날짜 형식입니다.',
        },
      },
    },
  })
  async getSchedulesByWeek(
    @Req() req,
    @Query('userUuid') queryUserUuid: string,
    @Query('date') date: string,
  ): Promise<ResponseScheduleDto[]> {
    const userUuid = queryUserUuid || req.user.userUuid;
    return this.schedulesService.findByWeek(userUuid, date);
  }

  @Get('month')
  @ApiOperation({ summary: '특정 월의 일정 조회' })
  @ApiQuery({
    name: 'userUuid',
    required: false,
    type: String,
    description: '사용자의 UUID',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: '조회할 연도',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: '조회할 월 (1-12)',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: [ResponseScheduleDto],
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '유효하지 않은 연도 또는 월입니다.',
        },
      },
    },
  })
  async getSchedulesByMonth(
    @Req() req,
    @Query('userUuid') queryUserUuid: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ): Promise<ResponseScheduleDto[]> {
    const userUuid = queryUserUuid || req.user.userUuid;
    return this.schedulesService.findByMonth(userUuid, year, month);
  }

  @Get('range')
  @ApiOperation({ summary: '특정 날짜 범위의 일정 조회' })
  @ApiQuery({
    name: 'userUuid',
    required: false,
    type: String,
    description: '사용자의 UUID',
  })
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
    @Query('userUuid') queryUserUuid: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ResponseScheduleDto[]> {
    const userUuid = queryUserUuid || req.user.userUuid;
    return this.schedulesService.getSchedulesInRange(
      userUuid,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('all')
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

  @Get(':id')
  @ApiOperation({
    summary: '일정 ID로 조회',
    description:
      '지정된 ID로 일정을 조회합니다. 반복 일정의 경우 첫 일정만 조회됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정 조회 성공',
    type: ResponseScheduleDto,
  })
  @ApiResponse({
    status: 404,
    description: '일정을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '해당 ID의 일정을 찾을 수 없습니다.',
        },
      },
    },
  })
  async getScheduleById(@Param('id') id: number): Promise<ResponseScheduleDto> {
    return await this.schedulesService.findOne(id);
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
    description:
      '기존 일정을 수정합니다. 단일 일정 또는 이후 모든 일정을 수정할 수 있습니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: '수정할 일정의 ID',
  })
  @ApiQuery({
    name: 'instanceDate',
    required: true,
    type: String,
    description: '수정할 인스턴스의 날짜 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'updateType',
    required: false,
    type: String,
    enum: ['single', 'future'],
    description: '수정 유형 (단일 또는 이후 모든 일정)',
  })
  @ApiBody({ type: UpdateScheduleDto })
  @ApiResponse({
    status: 200,
    description: '일정이 성공적으로 수정됨',
    type: ResponseScheduleDto,
  })
  async updateSchedule(
    @Req() req,
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Query('instanceDate') instanceDate: string,
    @Query('updateType') updateType: 'single' | 'future' = 'single',
  ): Promise<ResponseScheduleDto> {
    const userUuid = req.user.userUuid;
    updateScheduleDto.categoryId = updateScheduleDto.categoryId || 7;
    return await this.schedulesService.updateSchedule(
      userUuid,
      id,
      updateScheduleDto,
      new Date(instanceDate),
      updateType,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '일정 삭제' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: '삭제할 일정의 ID',
  })
  @ApiQuery({
    name: 'userUuid',
    required: false,
    type: String,
    description: '사용자의 UUID',
  })
  @ApiQuery({
    name: 'instanceDate',
    required: true,
    type: String,
    description: '삭제할 인스턴스의 날짜 (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'deleteType',
    required: false,
    type: String,
    enum: ['single', 'future'],
    description: '삭제 유형 (단일 또는 이후 모든 일정)',
  })
  @ApiResponse({
    status: 200,
    description: '일정 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '일정이 성공적으로 삭제되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '유효하지 않은 요청입니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '일정을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '해당 일정을 찾을 수 없습니다.',
        },
      },
    },
  })
  async deleteSchedule(
    @Req() req,
    @Param('id') id: number,
    @Query('userUuid') queryUserUuid: string,
    @Query('instanceDate') instanceDate: string,
    @Query('deleteType') deleteType: 'single' | 'future' = 'single',
  ): Promise<{ message: string }> {
    const userUuid = queryUserUuid || req.user.userUuid;
    await this.schedulesService.deleteSchedule(
      userUuid,
      id,
      instanceDate,
      deleteType,
    );
    return { message: '일정이 성공적으로 삭제되었습니다.' };
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
  ): Promise<CreateScheduleDto[]> {
    const ocrResult =
      await this.ocrTranscriptionService.extractTextFromNaverOCR(file);
    return await this.schedulesService.processWithGptOCR(ocrResult);
  }
}
