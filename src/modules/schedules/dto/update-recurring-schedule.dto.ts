import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRecurringScheduleDto } from './create-recurring-schedule.dto';

export class UpdateRecurringScheduleDto extends PartialType(
  OmitType(CreateRecurringScheduleDto, ['userUuid'] as const),
) {}
