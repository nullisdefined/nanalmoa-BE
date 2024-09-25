import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'name', length: 255 })
  categoryName: string;
}
