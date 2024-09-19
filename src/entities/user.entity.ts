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

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  profile_image: string;

  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;

  @Column()
  email: string;

  @Column({ default: false })
  is_manager: boolean;

  @OneToMany(() => Auth, (auth) => auth.user)
  auths: Auth[];
}
