import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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

  @Column({ nullable: true, type: 'enum', enum: AuthProvider })
  auth_provider: AuthProvider | null;

  @Column()
  oauth_id: string;

  @Column()
  refresh_token: string;

  @ManyToOne(() => User, (user) => user.auths)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
