import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Auth } from './auth.entity';
import { Schedule } from './schedule.entity';
import { UserRoutine } from './user-routine.entity';
import { GroupInvitation } from './group-invitation.entity';
import { GroupSchedule } from './group-schedule.entity';
import { ManagerInvitation } from './manager-invitation.entity';
import { ManagerSubordinate } from './manager-subordinate.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ type: 'uuid', unique: true, name: 'user_uuid' })
  userUuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.userUuid) {
      this.userUuid = uuidv4();
    }
  }

  @Column({ length: 20, nullable: true, name: 'name', default: '' })
  name?: string;

  @Column({ length: 255, nullable: true, name: 'profile_image', default: '' })
  profileImage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ length: 50, nullable: true, name: 'email', default: '' })
  email?: string;

  @Column({
    length: 20,
    nullable: true,
    name: 'phone_number',
    default: '',
  })
  phoneNumber?: string;

  @Column({ default: false, name: 'is_manager' })
  isManager: boolean;

  @Column({ length: 255, nullable: true, name: 'address', default: '' })
  address?: string;

  @OneToMany(() => Auth, (auth) => auth.user)
  auths?: Auth[];

  @OneToMany(() => Schedule, (schedule) => schedule.user)
  schedules?: Schedule[];

  @OneToOne(() => UserRoutine, (userRoutine) => userRoutine.user)
  routine?: UserRoutine;

  @OneToMany(() => GroupInvitation, (invitation) => invitation.inviter)
  sentGroupInvitations?: GroupInvitation[];

  @OneToMany(() => GroupInvitation, (invitation) => invitation.invitee)
  receivedGroupInvitations?: GroupInvitation[];

  @OneToMany(() => GroupSchedule, (groupSchedule) => groupSchedule.user)
  groupSchedules?: GroupSchedule[];

  @OneToMany(() => ManagerInvitation, (invitation) => invitation.manager)
  sentManagerInvitations?: ManagerInvitation[];

  @OneToMany(() => ManagerInvitation, (invitation) => invitation.subordinate)
  receivedManagerInvitations?: ManagerInvitation[];

  @OneToMany(
    () => ManagerSubordinate,
    (managerSubordinate) => managerSubordinate.manager,
  )
  manager?: ManagerSubordinate[];

  @OneToMany(
    () => ManagerSubordinate,
    (managerSubordinate) => managerSubordinate.subordinate,
  )
  subordinate?: ManagerSubordinate[];
}
