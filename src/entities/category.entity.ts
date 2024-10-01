import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Schedule } from './schedule.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'name', length: 255 })
  categoryName: string;

  @OneToMany(() => Schedule, (schedule) => schedule.category)
  schedules: Schedule[];
}
