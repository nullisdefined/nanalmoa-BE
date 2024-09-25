import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { Between, Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleResponseDto } from './dto/response-schedule.dto';
import { plainToInstance } from 'class-transformer';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { DateRangeDto } from './dto/data-range-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let repository: Repository<Schedule>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: getRepositoryToken(Schedule),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    repository = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));
  });

  describe('CreateScheduleDto', () => {
    it('기본값이 올바르게 설정되는지 확인', () => {
      const plainObject = {
        userId: 1,
        categoryId: 2,
        startDate: new Date(),
        endDate: new Date(),
        title: '테스트',
        place: '테스트 장소',
      };

      const dto = plainToInstance(CreateScheduleDto, plainObject);
      console.log(dto);
      expect(dto.isGroupSchedule).toBe(false);
      expect(dto.isAllDay).toBe(false);
      expect(dto.memo).toBe('');
    });
  });

  describe('create', () => {
    it('새 일정 생성', async () => {
      // 테스트용 DTO 객체 생성
      const createScheduleDto = {
        userId: 1,
        categoryId: 2,
        startDate: new Date('2023-09-21T09:00:00Z'),
        endDate: new Date('2023-09-21T18:00:00Z'),
        title: '마을 잔치',
        place: '노인정',
      };

      // plainToInstance를 사용하여 DTO 객체를 클래스 인스턴스로 변환
      // 이 과정에서 DTO에 정의된 기본값들이 적용됨
      const expectedScheduleData = plainToInstance(
        CreateScheduleDto,
        createScheduleDto,
      );

      // 저장될 것으로 예상되는 Schedule 객체 생성
      const expectedSavedSchedule = { scheduleId: 1, ...expectedScheduleData };

      // repository.create / save 메소드를 모의 구현하고 예상 결과 반환
      jest.spyOn(repository, 'create').mockReturnValue(expectedSavedSchedule);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedSavedSchedule);

      const result = await service.create(createScheduleDto);
      console.log('Result from service:', result);

      // repository.create/save가 올바른 인자로 호출되었는지 확인
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining(expectedScheduleData),
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(expectedScheduleData),
      );

      // 반환된 결과가 ScheduleResponseDto 인스턴스인지 확인
      expect(result).toBeInstanceOf(ScheduleResponseDto);

      // 반환된 결과가 예상한 데이터를 포함하고 있는지 확인
      expect(result).toEqual(expect.objectContaining(expectedSavedSchedule));
    });
  });

  describe('update', () => {
    it('존재하는 일정을 성공적으로 업데이트해야 함', async () => {
      // 테스트용 기존 일정 데이터
      const existingSchedule: Schedule = {
        scheduleId: 1,
        userId: 1,
        categoryId: 2,
        startDate: new Date('2023-09-21T09:00:00Z'),
        endDate: new Date('2023-09-21T18:00:00Z'),
        title: '마을 잔치',
        place: '노인정',
        memo: '',
        isGroupSchedule: false,
        isAllDay: false,
      };

      // 업데이트할 데이터
      const updateScheduleDto: UpdateScheduleDto = {
        title: '수정된 마을 잔치',
        place: '마을 회관',
      };

      // findOne 메소드 모의 구현
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingSchedule);

      // save 메소드 모의 구현
      const updatedSchedule = { ...existingSchedule, ...updateScheduleDto };
      jest.spyOn(repository, 'save').mockResolvedValue(updatedSchedule);

      // update 메소드 호출
      const result = await service.update(1, updateScheduleDto);

      // 결과 확인
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scheduleId: 1 },
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(updatedSchedule),
      );
      expect(result).toBeInstanceOf(ScheduleResponseDto);
      expect(result.title).toBe('수정된 마을 잔치');
      expect(result.place).toBe('마을 회관');
    });

    it('존재하지 않는 일정을 업데이트하려 할 때 NotFoundException을 던져야 함', async () => {
      // findOne 메소드가 null을 반환하도록 모의 구현
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // 업데이트할 데이터
      const updateScheduleDto: UpdateScheduleDto = {
        title: '수정된 마을 잔치',
      };

      // update 메소드 호출 및 예외 확인
      await expect(service.update(999, updateScheduleDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scheduleId: 999 },
      });
    });
  });

  describe('findOne', () => {
    it('존재하는 일정을 성공적으로 찾아야 함', async () => {
      // 테스트용 일정 데이터
      const testSchedule: Schedule = {
        scheduleId: 1,
        userId: 1,
        categoryId: 2,
        startDate: new Date('2023-09-21T09:00:00Z'),
        endDate: new Date('2023-09-21T18:00:00Z'),
        title: '마을 잔치',
        place: '노인정',
        memo: '',
        isGroupSchedule: false,
        isAllDay: false,
      };

      // findOne 메소드 모의 구현
      jest.spyOn(repository, 'findOne').mockResolvedValue(testSchedule);

      // findOne 메소드 호출
      const result = await service.findOne(1);

      // 결과 확인
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scheduleId: 1 },
      });
      expect(result).toBeInstanceOf(ScheduleResponseDto);
      expect(result.scheduleId).toBe(1);
      expect(result.title).toBe('마을 잔치');
      // 필요에 따라 다른 필드들도 확인할 수 있습니다.
    });

    it('존재하지 않는 일정을 찾으려 할 때 NotFoundException을 던져야 함', async () => {
      // findOne 메소드가 null을 반환하도록 모의 구현
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // findOne 메소드 호출 및 예외 확인
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scheduleId: 999 },
      });
    });
  });

  describe('findAllByUserId', () => {
    it('사용자의 모든 일정을 찾아야 함', async () => {
      const userId = 1;
      const testSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: userId,
          categoryId: 1,
          startDate: new Date('2023-09-21T09:00:00Z'),
          endDate: new Date('2023-09-21T18:00:00Z'),
          title: '일정 1',
          place: '장소 1',
          memo: '',
          isGroupSchedule: false,
          isAllDay: false,
        },
        {
          scheduleId: 2,
          userId: userId,
          categoryId: 2,
          startDate: new Date('2023-09-22T10:00:00Z'),
          endDate: new Date('2023-09-22T19:00:00Z'),
          title: '일정 2',
          place: '장소 2',
          memo: '',
          isGroupSchedule: false,
          isAllDay: false,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(testSchedules);

      const result = await service.findAllByUserId(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: userId },
        order: { startDate: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ScheduleResponseDto);
      expect(result[1]).toBeInstanceOf(ScheduleResponseDto);
      expect(result[0].title).toBe('일정 1');
      expect(result[1].title).toBe('일정 2');
    });

    it('사용자의 일정이 없을 경우 빈 배열을 반환해야 함', async () => {
      const userId = 999;
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAllByUserId(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: userId },
        order: { startDate: 'ASC' },
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('findByDateRange', () => {
    it('주어진 날짜 범위 내의 일정을 찾아야 함', async () => {
      const userId = 1;
      const dateRange: DateRangeDto = {
        startDate: new Date('2023-09-21T00:00:00Z'),
        endDate: new Date('2023-09-23T23:59:59Z'),
      };
      const testSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: userId,
          categoryId: 1,
          startDate: new Date('2023-09-21T09:00:00Z'),
          endDate: new Date('2023-09-21T18:00:00Z'),
          title: '일정 1',
          place: '장소 1',
          memo: '',
          isGroupSchedule: false,
          isAllDay: false,
        },
        {
          scheduleId: 2,
          userId: userId,
          categoryId: 2,
          startDate: new Date('2023-09-22T10:00:00Z'),
          endDate: new Date('2023-09-22T19:00:00Z'),
          title: '일정 2',
          place: '장소 2',
          memo: '',
          isGroupSchedule: false,
          isAllDay: false,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(testSchedules);

      const result = await service.findByDateRange(userId, dateRange);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: userId,
          startDate: Between(dateRange.startDate, dateRange.endDate),
        },
        order: { startDate: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ScheduleResponseDto);
      expect(result[1]).toBeInstanceOf(ScheduleResponseDto);
      expect(result[0].title).toBe('일정 1');
      expect(result[1].title).toBe('일정 2');
    });

    it('주어진 날짜 범위 내에 일정이 없을 경우 빈 배열을 반환해야 함', async () => {
      const userId = 1;
      const dateRange: DateRangeDto = {
        startDate: new Date('2023-10-01T00:00:00Z'),
        endDate: new Date('2023-10-31T23:59:59Z'),
      };

      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findByDateRange(userId, dateRange);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: userId,
          startDate: Between(dateRange.startDate, dateRange.endDate),
        },
        order: { startDate: 'ASC' },
      });
      expect(result).toHaveLength(0);
    });

    it('시작 날짜가 종료 날짜보다 늦을 경우 BadRequestException을 던져야 함', async () => {
      const userId = 1;
      const invalidDateRange: DateRangeDto = {
        startDate: new Date('2023-09-23T00:00:00Z'),
        endDate: new Date('2023-09-21T23:59:59Z'),
      };

      await expect(
        service.findByDateRange(userId, invalidDateRange),
      ).rejects.toThrow(BadRequestException);
    });
  });
  describe('findByMonth', () => {
    it('주어진 월의 일정을 찾아야 함', async () => {
      const userId = 1;
      const monthQuery: MonthQueryDto = { year: 2023, month: 9 };
      const testSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: userId,
          categoryId: 1,
          startDate: new Date('2023-09-15T09:00:00Z'),
          endDate: new Date('2023-09-15T18:00:00Z'),
          title: '9월 일정',
          place: '장소 1',
          memo: '',
          isGroupSchedule: false,
          isAllDay: false,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(testSchedules);

      const result = await service.findByMonth(userId, monthQuery);

      const startDate = new Date(2023, 8, 1); // JavaScript의 월은 0부터 시작
      const endDate = new Date(2023, 9, 0);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: userId,
          startDate: Between(startDate, endDate),
        },
        order: { startDate: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ScheduleResponseDto);
      expect(result[0].title).toBe('9월 일정');
    });

    it('주어진 월에 일정이 없을 경우 빈 배열을 반환해야 함', async () => {
      const userId = 1;
      const monthQuery: MonthQueryDto = { year: 2023, month: 10 };

      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findByMonth(userId, monthQuery);

      expect(repository.find).toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  describe('findByWeek', () => {
    it('주어진 주의 일정을 찾아야 함', async () => {
      const userId = 1;
      const weekQuery: WeekQueryDto = {
        date: new Date('2023-09-20T00:00:00Z'),
      }; // UTC 시간 사용
      const testSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: userId,
          categoryId: 1,
          startDate: new Date('2023-09-18T09:00:00Z'),
          endDate: new Date('2023-09-18T18:00:00Z'),
          title: '주간 일정 1',
          place: '장소 1',
          memo: '',
          isGroupSchedule: false,
          isAllDay: false,
        },
        {
          scheduleId: 2,
          userId: userId,
          categoryId: 2,
          startDate: new Date('2023-09-22T10:00:00Z'),
          endDate: new Date('2023-09-22T19:00:00Z'),
          title: '주간 일정 2',
          place: '장소 2',
          memo: '',
          isGroupSchedule: false,
          isAllDay: false,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(testSchedules);

      const result = await service.findByWeek(userId, weekQuery);

      // 시작 날짜와 종료 날짜를 UTC로 설정
      const startDate = new Date('2023-09-18T00:00:00.000Z');
      const endDate = new Date('2023-09-24T23:59:59.999Z');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: userId,
          startDate: Between(startDate, endDate),
        },
        order: { startDate: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ScheduleResponseDto);
      expect(result[1]).toBeInstanceOf(ScheduleResponseDto);
      expect(result[0].title).toBe('주간 일정 1');
      expect(result[1].title).toBe('주간 일정 2');
    });

    it('주어진 주에 일정이 없을 경우 빈 배열을 반환해야 함', async () => {
      const userId = 1;
      const weekQuery: WeekQueryDto = { date: new Date('2023-10-01') };

      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findByWeek(userId, weekQuery);

      expect(repository.find).toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });
});
