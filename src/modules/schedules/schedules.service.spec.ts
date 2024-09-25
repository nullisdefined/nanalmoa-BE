import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let repo: Repository<Schedule>;

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
    repo = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));
  });

  it('should create a schedule', async () => {
    const createScheduleDto: CreateScheduleDto = {
      userId: 1,
      categoryId: 1,
      startDate: new Date('2024-09-25T09:00:00'),
      endDate: new Date('2024-09-25T18:00:00'),
      title: 'Test Schedule',
      place: 'Test Place',
      memo: 'Test Memo',
      isGroupSchedule: false,
      isAllDay: false,
    };

    jest.spyOn(repo, 'create').mockReturnValue(createScheduleDto as Schedule);
    jest
      .spyOn(repo, 'save')
      .mockResolvedValue({ scheduleId: 1, ...createScheduleDto } as Schedule);

    const result = await service.create(createScheduleDto);

    expect(result).toBeDefined();
    expect(result.scheduleId).toBe(1);
    expect(result.title).toBe('Test Schedule');
  });

  it('should find schedules by month', async () => {
    const monthQuery: MonthQueryDto = {
      userId: 1,
      year: 2024,
      month: 9,
    };

    const mockSchedules = [
      { scheduleId: 1, title: 'Schedule 1' },
      { scheduleId: 2, title: 'Schedule 2' },
    ] as Schedule[];

    jest.spyOn(repo, 'find').mockResolvedValue(mockSchedules);

    const result = await service.findByMonth(monthQuery);

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Schedule 1');
    expect(result[1].title).toBe('Schedule 2');
  });

  it('should find schedules by week', async () => {
    const weekQuery: WeekQueryDto = {
      userId: 1,
      date: new Date('2024-09-25'),
    };

    const mockSchedules = [
      { scheduleId: 1, title: 'Schedule 1' },
      { scheduleId: 2, title: 'Schedule 2' },
      { scheduleId: 3, title: 'Schedule 3' },
    ] as Schedule[];

    jest.spyOn(repo, 'find').mockResolvedValue(mockSchedules);

    const result = await service.findByWeek(weekQuery);

    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    expect(result[0].title).toBe('Schedule 1');
    expect(result[1].title).toBe('Schedule 2');
    expect(result[2].title).toBe('Schedule 3');
  });
});
