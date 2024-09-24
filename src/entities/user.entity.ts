import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Auth } from './auth.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ length: 20, nullable: true, name: 'name' })
  name: string;

  @Column({ length: 255, nullable: true, name: 'profile_image' })
  profileImage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ length: 50, name: 'email' })
  email: string;

  @Column({ default: false, name: 'is_manager' })
  isManager: boolean;

  @OneToMany(() => Auth, (auth) => auth.user)
  auths: Auth[];
}
