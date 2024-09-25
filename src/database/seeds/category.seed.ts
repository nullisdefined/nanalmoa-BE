import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Category } from '../../entities/category.entity';

export class CategorySeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const categoryRepository = dataSource.getRepository(Category);

    const categories = [
      { categoryName: '병원' },
      { categoryName: '가족' },
      { categoryName: '종교' },
      { categoryName: '운동' },
      { categoryName: '경조사' },
      { categoryName: '복약' },
      { categoryName: '기타' },
    ];

    for (const category of categories) {
      const existingCategory = await categoryRepository.findOne({
        where: { categoryName: category.categoryName },
      });

      if (!existingCategory) {
        await categoryRepository.save(category);
        console.log(`카테고리 생성: ${category.categoryName}`);
      } else {
        console.log(`카테고리 이미 존재: ${category.categoryName}`);
      }
    }
  }
}
