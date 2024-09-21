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
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ length: 20, nullable: true })
  name: string;

  @Column({ length: 255, nullable: true })
  profile_image: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ length: 50 })
  email: string;

  @Column({ default: false })
  is_manager: boolean;

  @OneToMany(() => Auth, (auth) => auth.user)
  auths: Auth[];
}
