import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { User } from '../../entities/user.entity';
import { Auth, AuthProvider } from '../../entities/auth.entity';
import { faker } from '@faker-js/faker/locale/ko';

export class UserSeeder implements Seeder {
  private koreanLastNames = [
    '김',
    '이',
    '박',
    '최',
    '정',
    '강',
    '조',
    '윤',
    '장',
    '임',
    '한',
    '오',
    '서',
    '신',
    '권',
    '황',
    '안',
    '송',
    '전',
    '홍',
    '유',
    '고',
    '문',
    '양',
    '손',
    '배',
    '조',
    '백',
    '허',
    '유',
    '남',
    '심',
    '노',
    '정',
    '하',
    '곽',
    '성',
    '차',
    '주',
    '우',
    '구',
    '신',
    '임',
    '전',
    '민',
    '유',
    '류',
    '나',
    '진',
    '지',
    '엄',
    '채',
    '원',
    '천',
    '방',
    '공',
    '강',
    '현',
    '팽',
    '변',
    '염',
    '양',
    '변',
    '여',
    '추',
    '노',
    '도',
    '소',
    '신',
    '석',
    '선',
    '설',
    '마',
    '길',
    '주',
    '연',
    '방',
    '위',
    '표',
    '명',
    '기',
    '반',
    '왕',
    '금',
    '옥',
    '육',
    '인',
    '맹',
    '제',
    '모',
    '장',
    '남',
    '탁',
    '국',
    '여',
    '진',
    '어',
    '은',
    '편',
    '구',
    '용',
  ];

  private koreanFirstNames = [
    '민준',
    '서준',
    '도윤',
    '예준',
    '시우',
    '주원',
    '하준',
    '지호',
    '지후',
    '준서',
    '준우',
    '현우',
    '도현',
    '지훈',
    '건우',
    '우진',
    '선우',
    '서진',
    '민재',
    '현준',
    '연우',
    '유준',
    '정우',
    '승우',
    '승현',
    '시윤',
    '준혁',
    '은우',
    '지환',
    '승민',
    '지우',
    '유찬',
    '윤우',
    '민성',
    '준영',
    '시온',
    '이준',
    '은찬',
    '윤호',
    '민우',
    '주호',
    '진우',
    '시후',
    '지원',
    '은호',
    '승준',
    '유진',
    '서연',
    '서윤',
    '지우',
    '서현',
    '민서',
    '하은',
    '하윤',
    '윤서',
    '지유',
    '채원',
    '지민',
    '수아',
    '지아',
    '소율',
    '다은',
    '아인',
    '예은',
    '수빈',
    '지원',
    '소윤',
    '예린',
    '지안',
    '은서',
    '가은',
    '시은',
    '채은',
    '윤아',
    '유나',
    '예나',
    '민지',
    '서아',
    '한나',
    '서영',
    '다인',
    '수민',
    '예서',
    '다연',
    '수연',
    '예원',
    '은지',
    '수현',
    '시아',
    '지은',
    '채린',
    '유진',
    '윤지',
    '지현',
    '수진',
    '소은',
    '다현',
    '예지',
    '지윤',
    '유빈',
    '서희',
    '은채',
    '민채',
    '윤희',
    '태윤',
    '동현',
    '재윤',
    '재우',
    '준호',
    '민혁',
    '영민',
    '서우',
    '도훈',
    '현서',
    '재원',
    '시현',
    '은성',
    '지성',
    '현석',
    '동욱',
    '태현',
    '민규',
    '재현',
    '우빈',
    '명헌',
    '현빈',
    '다희',
    '다온',
    '하린',
    '서진',
    '지원',
    '서우',
    '하영',
    '서연',
    '하늘',
    '지율',
    '서아',
    '하람',
    '서영',
    '소연',
    '서윤',
    '하리',
    '서은',
    '하나',
    '서하',
    '하연',
  ];

  private profileImageTemplates = [
    'https://example.com/avatars/profile1.jpg',
    'https://example.com/avatars/profile2.jpg',
    'https://example.com/avatars/profile3.jpg',
    'https://example.com/avatars/profile4.jpg',
    'https://example.com/avatars/profile5.jpg',
    'https://example.com/avatars/profile6.jpg',
    'https://example.com/avatars/profile7.jpg',
    'https://example.com/avatars/profile8.jpg',
    'https://example.com/avatars/profile9.jpg',
    'https://example.com/avatars/profile10.jpg',
  ];

  private generateKoreanName(): string {
    const lastName = faker.helpers.arrayElement(this.koreanLastNames);
    const firstName = faker.helpers.arrayElement(this.koreanFirstNames);
    return `${lastName}${firstName}`;
  }

  private generateRandomDate(start: Date, end: Date): Date {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
  }

  private generatePhoneNumber(): string {
    return `010-${faker.string.numeric(4)}-${faker.string.numeric(4)}`;
  }

  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const authRepository = dataSource.getRepository(Auth);

    const users = [];
    const auths = [];
    // 특정 UUID를 가진 사용자 추가
    const specificUser = new User();
    specificUser.userUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    specificUser.name = this.generateKoreanName();
    specificUser.profileImage = faker.helpers.arrayElement(
      this.profileImageTemplates,
    );

    const specificAuth = new Auth();
    specificAuth.authProvider = AuthProvider.BASIC;
    specificAuth.refreshToken = faker.string.alphanumeric({ length: 64 });
    specificAuth.user = specificUser;

    users.push(specificUser);
    auths.push(specificAuth);

    for (let i = 0; i < 100; i++) {
      const user = new User();
      user.name = this.generateKoreanName();
      user.profileImage = faker.helpers.arrayElement(
        this.profileImageTemplates,
      );
      user.isManager = faker.datatype.boolean({ probability: 0.2 });

      const createdAt = this.generateRandomDate(
        new Date(2024, 0, 1),
        new Date(2024, 9, 31),
      );
      user.createdAt = createdAt;
      user.updatedAt = this.generateRandomDate(
        createdAt,
        new Date(2024, 9, 31),
      );

      const auth = new Auth();
      auth.authProvider = faker.helpers.arrayElement(
        Object.values(AuthProvider),
      );

      const hasEmail = faker.datatype.boolean({ probability: 0.7 });
      const hasPhone = hasEmail
        ? faker.datatype.boolean({ probability: 0.7 })
        : true;

      if (hasEmail) {
        if (auth.authProvider === AuthProvider.KAKAO) {
          user.email = `${faker.internet.userName().toLowerCase()}${faker.number.int(999)}@kakao.com`;
        } else if (auth.authProvider === AuthProvider.NAVER) {
          user.email = `${faker.internet.userName().toLowerCase()}${faker.number.int(999)}@naver.com`;
        } else {
          user.email = `${faker.internet.userName().toLowerCase()}${faker.number.int(999)}@${faker.internet.domainName()}`;
        }
      } else {
        user.email = null;
      }

      user.phoneNumber = hasPhone ? this.generatePhoneNumber() : null;

      if (auth.authProvider !== AuthProvider.BASIC) {
        auth.oauthId = faker.string.uuid();
      }

      auth.refreshToken = faker.string.alphanumeric({ length: 64 });

      users.push(user);
      auths.push(auth);
    }

    await dataSource.transaction(async (transactionalEntityManager) => {
      for (let i = 0; i < users.length; i++) {
        try {
          const savedUser = await transactionalEntityManager.save(
            User,
            users[i],
          );
          auths[i].userUuid = savedUser.userUuid;
          auths[i].user = savedUser;
          await transactionalEntityManager.save(Auth, auths[i]);
          console.log(`사용자 생성: ${savedUser.name} (${savedUser.userUuid})`);
          console.log(
            `사용자 인증 생성: ${savedUser.name}, 소셜 프로바이더: ${auths[i].authProvider}`,
          );
        } catch (error) {
          console.error(`사용자 및 인증 생성 오류: ${users[i].name}`, error);
        }
      }
    });

    console.log(`총 ${users.length}개의 사용자 및 인증 항목이 생성되었습니다.`);
  }
}
