import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { Between, Repository } from 'typeorm';
import { ScheduleResponseDto } from './dto/response-schedule.dto';
import { DateRangeDto } from './dto/data-range-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { plainToInstance } from 'class-transformer';
import { VoiceScheduleConfirmDto } from './dto/voice-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
  ) {}

  async create(
    createScheduleDto: CreateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    // 기본값을 넣어주는 용도 (일반 자바스크립트 객체를 클래스의 인스턴스로 변환, 클래스에 정의된 데코레이터와 기본값들이 적용)
    const scheduleData = plainToInstance(CreateScheduleDto, createScheduleDto);

    const newSchedule = this.schedulesRepository.create(scheduleData);
    const savedSchedule = await this.schedulesRepository.save(newSchedule);
    return new ScheduleResponseDto(savedSchedule);
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
    });
    if (!schedule) {
      throw new NotFoundException(
        `해당 "${id}를 가진 스케쥴을 찾을 수 없습니다." `,
      );
    }

    // 업데이트할 필드만 병합
    Object.assign(schedule, updateScheduleDto);
    const savedSchedule = await this.schedulesRepository.save(schedule);
    return new ScheduleResponseDto(savedSchedule);
  }

  async remove(id: number): Promise<void> {
    const result = await this.schedulesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `해당 "${id}를 가진 스케쥴을 찾을 수 없습니다." `,
      );
    }
  }

  async findOne(id: number): Promise<ScheduleResponseDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
    });
    if (!schedule) {
      throw new NotFoundException(
        `해당 "${id}를 가진 스케쥴을 찾을 수 없습니다." `,
      );
    }
    return new ScheduleResponseDto(schedule);
  }

  async findAllByUserId(userId: number): Promise<ScheduleResponseDto[]> {
    const schedules = await this.schedulesRepository.find({
      where: { userId: userId },
      order: { startDate: 'ASC' }, // 시작 날짜 기준 오름차순 정렬
    });

    return schedules.map((schedule) => new ScheduleResponseDto(schedule));
  }

  async findByDateRange(
    userId: number,
    dateRange: DateRangeDto,
  ): Promise<ScheduleResponseDto[]> {
    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        '시작 날짜는 종료 날짜보다 늦을 수 없습니다.',
      );
    }

    const schedules = await this.schedulesRepository.find({
      where: {
        userId: userId,
        startDate: Between(dateRange.startDate, dateRange.endDate),
      },
      order: { startDate: 'ASC' },
    });

    return schedules.map((schedule) => new ScheduleResponseDto(schedule));
  }

  async findByMonth(
    userId: number,
    monthQuery: MonthQueryDto,
  ): Promise<ScheduleResponseDto[]> {
    const startDate = new Date(monthQuery.year, monthQuery.month - 1, 1);
    const endDate = new Date(monthQuery.year, monthQuery.month, 0); // 마지막 날짜

    const schedules = await this.schedulesRepository.find({
      where: {
        userId: userId,
        startDate: Between(startDate, endDate),
      },
      order: { startDate: 'ASC' },
    });

    return schedules.map((schedule) => new ScheduleResponseDto(schedule));
  }

  async findByWeek(
    userId: number,
    weekQuery: WeekQueryDto,
  ): Promise<ScheduleResponseDto[]> {
    const date = new Date(weekQuery.date);
    date.setUTCHours(0, 0, 0, 0); // UTC 시간으로 설정
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 월요일을 기준으로 주의 시작일 계산

    const startDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff),
    );
    const endDate = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        diff + 6,
        23,
        59,
        59,
        999,
      ),
    );

    const schedules = await this.schedulesRepository.find({
      where: {
        userId: userId,
        startDate: Between(startDate, endDate),
      },
      order: { startDate: 'ASC' },
    });

    return schedules.map((schedule) => new ScheduleResponseDto(schedule));
  }

  async processVoiceSchedule(
    audioBuffer: Buffer,
    currentDateTime: string,
  ): Promise<VoiceScheduleConfirmDto[]> {
    return [];
  }

  async confirmAndSaveSchedule(
    scheduleData: VoiceScheduleConfirmDto[],
  ): Promise<ScheduleResponseDto[]> {
    return scheduleData.map(
      (data) =>
        new ScheduleResponseDto({
          scheduleId: 0, // 임시 ID
          ...data,
        } as Schedule),
    );
  }
}
