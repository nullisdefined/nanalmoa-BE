import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';
import { resolve } from 'path';
import { Auth } from './entities/auth.entity';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Schedule } from './entities/schedule.entity';
import { CategorySeeder } from './database/seeds/category.seed';
import { ScheduleSeeder } from './database/seeds/schedule.seed';
import { ManagerInvitation } from './entities/manager-invitation.entity';
import { ManagerSubordinate } from './entities/manager-subordinate.entity';
import { UserSeeder } from './database/seeds/user.seed';
import { Group } from './entities/group.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupSchedule } from './entities/group-schedule.entity';
import { UserGroup } from './entities/user-group.entity';
import { UserRoutine } from './entities/user-routine.entity';

config({ path: resolve(__dirname, `../.${process.env.NODE_ENV}.env`) });

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    Auth,
    User,
    Category,
    Schedule,
    ManagerInvitation,
    ManagerSubordinate,
    Group,
    GroupInvitation,
    GroupSchedule,
    UserGroup,
    UserRoutine,
  ],
  migrations: [resolve(__dirname, 'migrations', '*.{js,ts}')],
  seeds: [CategorySeeder],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  // extra: {
  //   timezone: '+09:00',
  // },
  synchronize: process.env.NODE_ENV === 'production' ? false : true,
};

export const dataSource = new DataSource(dataSourceOptions);
