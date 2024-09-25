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
  authId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'enum', enum: AuthProvider, name: 'auth_provider' })
  authProvider: AuthProvider;

  @Column({ length: 255, name: 'oauth_id' })
  oauthId: string;

  @Column({ length: 255, nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.auths, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
