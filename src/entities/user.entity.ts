import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Auth } from './auth.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ type: 'uuid', unique: true, name: 'user_uuid' })
  userUuid: string;

  @Column({ length: 20, nullable: true, name: 'name' })
  name: string;

  @Column({ length: 255, nullable: true, name: 'profile_image' })
  profileImage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ length: 50, nullable: true, name: 'email' })
  email: string;

  @Column({ length: 20, unique: true, nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ default: false, name: 'is_manager' })
  isManager: boolean;

  @OneToMany(() => Auth, (auth) => auth.user)
  auths: Auth[];

  @BeforeInsert()
  generateUuid() {
    if (!this.userUuid) {
      this.userUuid = uuidv4();
    }
  }
}
