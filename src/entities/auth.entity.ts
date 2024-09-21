import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AuthProvider {
  KAKAO = 'kakao',
  NAVER = 'naver',
}

@Entity('auth')
export class Auth {
  @PrimaryGeneratedColumn()
  auth_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'enum', enum: AuthProvider })
  auth_provider: AuthProvider;

  @Column()
  oauth_id: string;

  @Column({ nullable: true })
  refresh_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.auths, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
