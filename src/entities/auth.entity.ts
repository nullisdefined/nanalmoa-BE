import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AuthProvider {
  KAKAO = 'kakao',
  NAVER = 'naver',
  BASIC = 'basic',
}

@Entity('auth')
export class Auth {
  @PrimaryGeneratedColumn()
  authId: number;

  @Column({ name: 'user_uuid' })
  userUuid: string;

  @Column({ type: 'enum', enum: AuthProvider, name: 'auth_provider' })
  authProvider: AuthProvider;

  @Column({ length: 255, nullable: true, name: 'oauth_id' })
  oauthId: string;

  @Column({ length: 255, nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.auths)
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'userUuid' })
  user: User;
}
