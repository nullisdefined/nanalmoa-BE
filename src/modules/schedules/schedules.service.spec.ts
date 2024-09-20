import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import moment from 'moment-timezone';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let repository: Repository<Schedule>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: getRepositoryToken(Schedule),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    repository = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('메모 있는 버전의 스케쥴 생성', async () => {
      const scheduleData: CreateScheduleDto = {
        userId: 1,
        categoryId: 1,
        startDate: moment().tz('Asia/Seoul').toDate(), // 한국 시간으로 변환
        endDate: moment().tz('Asia/Seoul').toDate(), // 한국 시간으로 변환
        title: '테스트 일정',
        place: '테스트 장소',
        isGroupSchedule: false,
        memo: '테스트 메모',
      };
      console.log(
        moment(scheduleData.startDate)
          .tz('Asia/Seoul')
          .format('YYYY-MM-DD HH:mm:ss'),
      );
      const savedSchedule: Schedule = {
        scheduleId: 1,
        ...scheduleData,
        memo: scheduleData.memo || null,
      };

      jest.spyOn(repository, 'create').mockReturnValue(savedSchedule);
      jest.spyOn(repository, 'save').mockResolvedValue(savedSchedule);

      const result = await service.create(scheduleData);

      expect(result).toEqual(savedSchedule);
      expect(repository.create).toHaveBeenCalledWith(scheduleData);
      expect(repository.save).toHaveBeenCalledWith(savedSchedule);
    });

    it('메모 없는 버전의 스케쥴 생성', async () => {
      const scheduleData: CreateScheduleDto = {
        userId: 1,
        categoryId: 1,
        startDate: moment().tz('Asia/Seoul').toDate(), // 한국 시간으로 변환
        endDate: moment().tz('Asia/Seoul').toDate(), // 한국 시간으로 변환
        title: '테스트 일정',
        place: '테스트 장소',
        isGroupSchedule: false,
      };

      const savedSchedule: Schedule = {
        scheduleId: 1,
        ...scheduleData,
        memo: null,
      };

      jest.spyOn(repository, 'create').mockReturnValue(savedSchedule);
      jest.spyOn(repository, 'save').mockResolvedValue(savedSchedule);

      const result = await service.create(scheduleData);

      expect(result).toEqual(savedSchedule);
      expect(repository.create).toHaveBeenCalledWith(scheduleData);
      expect(repository.save).toHaveBeenCalledWith(savedSchedule);
    });
  });

  describe('findOne', () => {
    it('존재하는 일정을 찾아야 합니다', async () => {
      const mockSchedule: Schedule = {
        scheduleId: 1,
        userId: 1,
        categoryId: 1,
        startDate: new Date(),
        endDate: new Date(),
        title: '테스트 일정',
        place: '테스트 장소',
        isGroupSchedule: false,
        memo: '테스트 메모',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSchedule);

      const result = await service.findOne(1);
      expect(result).toEqual(mockSchedule);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scheduleId: 1 },
      });
    });

    it('존재하지 않는 일정을 찾으려 하면 NotFoundException을 던져야 합니다', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('존재하는 일정을 업데이트해야 합니다', async () => {
      const updateDto: UpdateScheduleDto = {
        title: '업데이트된 일정',
        place: '업데이트된 장소',
      };

      const mockSchedule: Schedule = {
        scheduleId: 1,
        userId: 1,
        categoryId: 1,
        startDate: new Date(),
        endDate: new Date(),
        title: '원래 일정',
        place: '원래 장소',
        isGroupSchedule: false,
        memo: '테스트 메모',
      };

      const updatedSchedule = { ...mockSchedule, ...updateDto };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSchedule);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedSchedule);

      const result = await service.update(1, updateDto);
      expect(result).toEqual(updatedSchedule);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { scheduleId: 1 },
      });
      expect(repository.save).toHaveBeenCalledWith(updatedSchedule);
    });

    it('존재하지 않는 일정을 업데이트하려 하면 NotFoundException을 던져야 합니다', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(999, { title: '업데이트된 일정' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('존재하는 일정을 삭제해야 합니다', async () => {
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('존재하지 않는 일정을 삭제하려 하면 NotFoundException을 던져야 합니다', async () => {
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDateRange', () => {
    it('날짜 범위 내의 일정을 찾아야 합니다', async () => {
      const mockSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: 1,
          categoryId: 1,
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-06-02'),
          title: '일정 1',
          place: '장소 1',
          isGroupSchedule: false,
          memo: '메모 1',
        },
        {
          scheduleId: 2,
          userId: 1,
          categoryId: 1,
          startDate: new Date('2023-06-03'),
          endDate: new Date('2023-06-04'),
          title: '일정 2',
          place: '장소 2',
          isGroupSchedule: false,
          memo: '메모 2',
        },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(mockSchedules);

      const result = await service.findByDateRange(1, {
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-06-04'),
      });

      expect(result).toEqual(mockSchedules);
      expect(repository.find).toHaveBeenCalled();
    });
    it('시작 날짜가 종료 날짜보다 늦으면 BadRequestException을 던져야 합니다', async () => {
      await expect(
        service.findByDateRange(1, {
          startDate: new Date('2023-06-04'),
          endDate: new Date('2023-06-01'),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByMonth', () => {
    it('특정 월의 일정을 찾아야 합니다', async () => {
      const mockSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: 1,
          categoryId: 1,
          startDate: new Date('2023-06-15'),
          endDate: new Date('2023-06-16'),
          title: '6월 일정',
          place: '장소',
          isGroupSchedule: false,
          memo: '메모',
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockSchedules);

      const result = await service.findByMonth(1, { year: 2023, month: 6 });

      expect(result).toEqual(mockSchedules);
      expect(repository.find).toHaveBeenCalled();
    });

    it('해당 월에 일정이 없으면 빈 배열을 반환해야 합니다', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findByMonth(1, { year: 2023, month: 7 });

      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findByWeek', () => {
    it('특정 주의 일정을 찾아야 합니다', async () => {
      const mockSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: 1,
          categoryId: 1,
          startDate: new Date('2023-06-20'),
          endDate: new Date('2023-06-21'),
          title: '주간 일정',
          place: '장소',
          isGroupSchedule: false,
          memo: '메모',
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockSchedules);

      const result = await service.findByWeek(1, {
        date: new Date('2023-06-19'),
      });

      expect(result).toEqual(mockSchedules);
      expect(repository.find).toHaveBeenCalled();
    });

    it('해당 주에 일정이 없으면 빈 배열을 반환해야 합니다', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findByWeek(1, {
        date: new Date('2023-06-26'),
      });

      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findAllByUserId', () => {
    it('사용자의 모든 일정을 찾아야 합니다', async () => {
      const mockSchedules: Schedule[] = [
        {
          scheduleId: 1,
          userId: 1,
          categoryId: 1,
          startDate: new Date('2023-06-15'),
          endDate: new Date('2023-06-16'),
          title: '일정 1',
          place: '장소 1',
          isGroupSchedule: false,
          memo: '메모 1',
        },
        {
          scheduleId: 2,
          userId: 1,
          categoryId: 2,
          startDate: new Date('2023-06-20'),
          endDate: new Date('2023-06-21'),
          title: '일정 2',
          place: '장소 2',
          isGroupSchedule: true,
          memo: '메모 2',
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockSchedules);

      const result = await service.findAllByUserId(1);

      expect(result).toEqual(mockSchedules);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { startDate: 'ASC' },
      });
    });

    it('사용자에게 일정이 없으면 빈 배열을 반환해야 합니다', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAllByUserId(999);

      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 999 },
        order: { startDate: 'ASC' },
      });
    });
  });
  describe('엣지 케이스', () => {
    it('startDate가 endDate보다 늦은 일정 생성 시 BadRequestException을 던져야 합니다', async () => {
      const invalidSchedule: CreateScheduleDto = {
        userId: 1,
        categoryId: 1,
        startDate: new Date('2023-06-20'),
        endDate: new Date('2023-06-19'),
        title: '잘못된 일정',
        place: '장소',
        isGroupSchedule: false,
      };

      await expect(service.create(invalidSchedule)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('월 경계에 걸친 일정도 findByMonth에서 찾아야 합니다', async () => {
      const borderSchedule: Schedule = {
        scheduleId: 1,
        userId: 1,
        categoryId: 1,
        startDate: new Date('2023-05-31'),
        endDate: new Date('2023-06-02'),
        title: '월 경계 일정',
        place: '장소',
        isGroupSchedule: false,
        memo: '메모',
      };

      jest.spyOn(repository, 'find').mockResolvedValue([borderSchedule]);

      const result = await service.findByMonth(1, { year: 2023, month: 6 });

      expect(result).toContainEqual(borderSchedule);
      expect(repository.find).toHaveBeenCalled();
    });

    it('주 경계에 걸친 일정도 findByWeek에서 찾아야 합니다', async () => {
      const borderSchedule: Schedule = {
        scheduleId: 1,
        userId: 1,
        categoryId: 1,
        startDate: new Date('2023-06-18'), // 일요일
        endDate: new Date('2023-06-20'), // 화요일
        title: '주 경계 일정',
        place: '장소',
        isGroupSchedule: false,
        memo: '메모',
      };

      jest.spyOn(repository, 'find').mockResolvedValue([borderSchedule]);

      const result = await service.findByWeek(1, {
        date: new Date('2023-06-19'),
      }); // 월요일

      expect(result).toContainEqual(borderSchedule);
      expect(repository.find).toHaveBeenCalled();
    });
  });
});
