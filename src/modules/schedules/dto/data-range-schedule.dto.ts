import { CreateScheduleDto } from './create-schedule.dto';
import { PickType } from '@nestjs/mapped-types';

export class DateRangeDto extends PickType(CreateScheduleDto, [
  'startDate',
  'endDate',
  'userId',
] as const) {}
