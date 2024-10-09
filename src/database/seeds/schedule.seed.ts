import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Schedule } from '../../entities/schedule.entity';
import { Category } from '../../entities/category.entity';
import { faker } from '@faker-js/faker/locale/ko';

export class ScheduleSeeder implements Seeder {
  private scheduleTemplates = [
    '병원 진료',
    '치과 검진',
    '건강검진',
    '예방접종',
    '한의원 방문',
    '가족 모임',
    '친척 방문',
    '명절 모임',
    '가족 여행',
    '가족 식사',
    '교회 예배',
    '불교 법회',
    '종교 행사',
    '명상 시간',
    '기도 모임',
    '운동 시간',
    '요가 수업',
    '필라테스',
    '수영',
    '등산',
    '조깅',
    '헬스장',
    '친구 결혼식',
    '동창회',
    '친구 생일파티',
    '술자리',
    '친구 만남',
    '약 복용',
    '영양제 복용',
    '다이어트 식단',
    '건강식 준비',
    '미용실 예약',
    '네일아트',
    '피부관리',
    '마사지',
    '왁싱',
    '여행 계획',
    '휴가',
    '출장',
    '워크샵',
    '세미나 참석',
    '회사 미팅',
    '프로젝트 마감',
    '보고서 제출',
    '업무 교육',
    '인터뷰',
    '생일 파티',
    '기념일',
    '졸업식',
    '입학식',
    '승진 축하',
    '학교 행사',
    '학부모 상담',
    '시험',
    '과제 제출',
    '학원 수업',
    '봉사 활동',
    '기부',
    '환경정화 활동',
    '헌혈',
    '자선 행사',
    '쇼핑',
    '장보기',
    '온라인 쇼핑',
    '선물 구매',
    '의류 쇼핑',
    '영화 관람',
    '콘서트',
    '전시회',
    '연극 관람',
    '뮤지컬 관람',
    '독서 시간',
    '도서관 방문',
    '독서 모임',
    '북카페 방문',
    '집 청소',
    '빨래',
    '요리',
    '설거지',
    '정리정돈',
    '차량 정비',
    '주택 수리',
    '가전제품 수리',
    '인테리어',
    '은행 업무',
    '보험 상담',
    '세금 신고',
    '재테크 상담',
    '반려동물 돌보기',
    '애완동물 미용',
    '동물병원 방문',
    '펫 카페',
    '요리 교실',
    '악기 레슨',
    '언어 학습',
    '프로그래밍 공부',
    '사진 촬영',
    '그림 그리기',
    '글쓰기',
    '공예 활동',
    '명소 방문',
    '박물관 관람',
    '동물원 방문',
    '식물원 구경',
    '데이트',
    '미팅',
    '소개팅',
    '커플 기념일',
    '자격증 시험',
    '운전면허 시험',
    '공무원 시험',
    '어학 시험',
    '이사',
    '집들이',
    '가구 구매',
    '전기 검침',
    '헤어 컷',
    '염색',
    '파마',
    '두피 케어',
    '차 마시기',
    '와인 시음',
    '맥주 축제',
    '커피 로스팅',
    '캠핑',
    '피크닉',
    '바베큐 파티',
    '해변 나들이',
    '명상',
    '요가',
    '필라테스',
    '태극권',
    '골프',
    '테니스',
    '배드민턴',
    '탁구',
    '스키',
    '스노보드',
    '스케이트',
    '서핑',
    '악기 연주',
    '노래 부르기',
    '춤추기',
    'DJ 세션',
    '게임 night',
    '보드게임',
    '온라인 게임',
    'e스포츠 대회',
    '드라이브',
    '자전거 타기',
    '오토바이 라이딩',
    '스쿠터 여행',
    '요리 대회',
    '베이킹',
    '쿠킹 클래스',
    '맛집 탐방',
    '일기 쓰기',
    '블로그 포스팅',
    '유튜브 촬영',
    '팟캐스트 녹음',
    '명상 수련',
    '요가 리트릿',
    '템플 스테이',
    '힐링 캠프',
    '마술 배우기',
    '저글링 연습',
    '서커스 교실',
    '마임 공연',
    '드론 조종',
    'RC카 레이싱',
    '모형 비행기 날리기',
    '연 날리기',
    '별자리 관측',
    '천체 망원경 조립',
    '우주 강연',
    '과학관 방문',
    '꽃꽂이',
    '정원 가꾸기',
    '분재 관리',
    '허브 재배',
    '와인 테이스팅',
    '맥주 양조',
    '전통주 만들기',
    '칵테일 클래스',
    '퍼즐 맞추기',
    '스도쿠',
    '크로스워드',
    '루빅스 큐브',
    '명상 앱 사용',
    '수면 주기 체크',
    '걸음 수 측정',
    '물 섭취량 기록',
    '팟캐스트 청취',
    '오디오북 듣기',
    'ASMR 감상',
    '명상 음악 듣기',
    '온라인 강의 수강',
    '웨비나 참석',
    '화상 회의',
    '온라인 독서 모임',
    '가상 현실(VR) 체험',
    '증강 현실(AR) 게임',
    '3D 프린팅',
    '드론 촬영',
    '스마트홈 설정',
    'IoT 기기 연동',
    '홈 오토메이션',
    '스마트 조명 설치',
  ];

  private memoTemplates = [
    '준비물 체크하기',
    '시간 엄수하기',
    '복장 확인하기',
    '중요 서류 챙기기',
    '건강 상태 확인하기',
    '교통편 확인하기',
    '주차 공간 확인하기',
    '날씨 체크하기',
    '연락처 확인하기',
    '예약 재확인하기',
    '회의 안건 검토하기',
    '발표 자료 준비하기',
    '선물 준비하기',
    '식사 메뉴 정하기',
    '알러지 유무 확인하기',
    '특이사항 기록하기',
    '필요한 앱 다운로드하기',
    '배터리 충전하기',
    '와이파이 비밀번호 확인하기',
    '긴급 연락망 저장하기',
    '여분 옷 챙기기',
    '우산 준비하기',
    '선크림 바르기',
    '물병 챙기기',
    '명함 준비하기',
    '포트폴리오 정리하기',
    '질문 리스트 작성하기',
    '피드백 정리하기',
    '운동복 준비하기',
    '운동 목표 설정하기',
    '운동 루틴 정하기',
    '운동 파트너 연락하기',
    '식단 계획하기',
    '영양제 챙기기',
    '물 마시기 알람 설정하기',
    '식사 시간 정하기',
    '여행 일정 확인하기',
    '여권 만료일 체크하기',
    '환전하기',
    '여행 보험 가입하기',
    '숙제 마감일 확인하기',
    '참고 자료 정리하기',
    '스터디 그룹 연락하기',
    '온라인 강의 듣기',
    '가계부 정리하기',
    '영수증 모으기',
    '세금 서류 준비하기',
    '예산 계획 세우기',
    '집 점검하기',
    '분리수거하기',
    '화분 물주기',
    '반려동물 사료 준비하기',
    '독서 목록 만들기',
    '도서관 반납일 체크하기',
    '독서 노트 준비하기',
    '북클럽 일정 확인하기',
    '취미 용품 준비하기',
    '새로운 기술 배우기',
    '작품 구상하기',
    '전시회 일정 확인하기',
    '친구에게 안부 전하기',
    '가족 일정 공유하기',
    '동창회 회비 납부하기',
    '기념일 선물 고르기',
    '건강검진 결과 확인하기',
    '복용약 챙기기',
    '운동 기록 작성하기',
    '식단 일기 쓰기',
    '명상 앱 설치하기',
    '스트레칭 루틴 정하기',
    '감사 일기 쓰기',
    '긍정적인 affirmation 정하기',
    '재활용품 분리하기',
    '에너지 절약 실천하기',
    '일회용품 줄이기',
    '친환경 제품 사용하기',
    '온라인 쇼핑 목록 만들기',
    '할인 쿠폰 확인하기',
    '포인트 적립 확인하기',
    '상품 리뷰 작성하기',
    '영화 리스트 만들기',
    '팝콘 준비하기',
    '영화 예매하기',
    '관람 후기 공유하기',
    '요리 레시피 찾기',
    '식재료 준비하기',
    '주방 도구 점검하기',
    '요리 사진 찍기',
    '여행지 정보 수집하기',
    '숙소 예약하기',
    '렌터카 예약하기',
    '여행 일정표 만들기',
    '업무 To-Do 리스트 작성하기',
    '이메일 확인하기',
    '회의록 작성하기',
    '업무 보고서 준비하기',
  ];

  private locationTemplates = [
    '홍대입구역',
    '건대입구역',
    '잠실역',
    '중앙대입구역',
    '성신여대입구역',
    '강남역',
    '신촌역',
    '이태원역',
    '명동역',
    '종로3가역',
    '여의도역',
    '강변역',
    '고속터미널역',
    '사당역',
    '신림역',
    '왕십리역',
    '혜화역',
    '광화문역',
    '을지로입구역',
    '합정역',
    '압구정로데오역',
    '가로수길',
    '연남동',
    '상수역',
    '망원역',
    '이대역',
    '노량진역',
    '교대역',
    '강동역',
    '천호역',
    '구로디지털단지역',
    '신도림역',
    '영등포역',
    '용산역',
    '서울역',
    '청량리역',
    '동대문역사문화공원역',
    '경복궁역',
    '안국역',
    '충무로역',
    '동대문역',
    '을지로3가역',
    '시청역',
    '서울숲',
    '뚝섬역',
    '성수역',
    '건국대학교',
    '서울대입구역',
    '고려대역',
    '한양대역',
    '이촌역',
    '동작역',
    '노원역',
    '수유역',
    '미아사거리역',
    '불광역',
    '연신내역',
    '대학로',
    '종각역',
    '동묘앞역',
    '남영역',
    '숙대입구역',
    '삼각지역',
    '녹사평역',
    '이태원',
    '한남동',
    '청담동',
    '신사동',
    '논현동',
    '역삼동',
    '도곡동',
    '대치동',
    '개포동',
    '일원동',
    '수서역',
    '양재역',
    '남부터미널역',
    '양재시민의숲역',
    '청계산입구역',
    '판교역',
    '강남구청역',
    '선릉역',
    '삼성역',
    '종합운동장역',
    '신천역',
    '석촌역',
    '송파나루역',
    '한성백제역',
    '올림픽공원역',
    '방이역',
    '오금역',
    '개롱역',
    '거여역',
    '마천역',
    '길동역',
    '굽은다리역',
    '명일역',
    '고덕역',
    '상일동역',
    '둔촌동역',
    '남산타워',
    '경복궁',
    '창덕궁',
    '덕수궁',
    '창경궁',
    '국립중앙박물관',
    '전쟁기념관',
    '서울시립미술관',
    '국립현대미술관',
    '삼성미술관 리움',
    '북촌한옥마을',
    '인사동',
    '삼청동',
    '서촌',
    '익선동',
    '청계천',
    '한강공원',
    '올림픽공원',
    '서울숲',
    '월드컵공원',
    '남산공원',
    '북서울꿈의숲',
    '서울대공원',
    '어린이대공원',
    '보라매공원',
    '63빌딩',
    '롯데월드타워',
    '코엑스',
    '동대문디자인플라자',
    '세빛섬',
    '노량진 수산시장',
    '광장시장',
    '통인시장',
    '남대문시장',
    '동대문시장',
    '이태원 앤틱가구거리',
    '홍대 걷고싶은거리',
    '가로수길',
    '경리단길',
    '연남동',
    '북악스카이웨이',
    '남산 케이블카',
    '서울로7017',
    '낙산공원',
    '하늘공원',
    '서울식물원',
    '서울어린이대공원',
    '서울랜드',
    '롯데월드',
    '에버랜드',
    '여의도 한강공원',
    '반포 한강공원',
    '뚝섬 한강공원',
    '잠실 한강공원',
    '망원 한강공원',
    '서울대학교',
    '연세대학교',
    '고려대학교',
    '이화여자대학교',
    '한양대학교',
    '청와대',
    '국회의사당',
    '서울시청',
    '광화문광장',
    '서울광장',
    '명동성당',
    '조계사',
    '봉은사',
    '원각사',
    '종로 탑골공원',
    '서울역사박물관',
    '국립민속박물관',
    '서대문형무소역사관',
    '서울역사박물관',
    '북한산국립공원',
    '도봉산',
    '관악산',
    '청계산',
    '불암산',
  ];

  async run(dataSource: DataSource): Promise<void> {
    const categoryRepository = dataSource.getRepository(Category);

    const categories = await categoryRepository.find();
    if (categories.length === 0) {
      console.error('카테고리가 없습니다. 먼저 CategorySeeder를 실행해주세요.');
      return;
    }

    const years = [2022, 2023, 2024, 2025];
    const schedules = [];

    for (const year of years) {
      const startRange = new Date(`${year}-01-01`);
      const endRange = new Date(`${year}-12-31`);

      for (let i = 0; i < 100; i++) {
        const startDate = faker.date.between({
          from: startRange,
          to: endRange,
        });
        const duration = faker.number.int({ min: 1, max: 7 }); // 1일에서 7일 사이
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration - 1);

        const isAllDay = faker.datatype.boolean(0.25);
        if (isAllDay) {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate.setHours(
            faker.number.int({ min: 0, max: 23 }),
            faker.number.int({ min: 0, max: 59 }),
            0,
            0,
          );
          endDate.setHours(
            faker.number.int({ min: startDate.getHours(), max: 23 }),
            faker.number.int({ min: 0, max: 59 }),
            59,
            999,
          );
        }

        const title = faker.helpers.arrayElement(this.scheduleTemplates);

        const schedule = {
          userId: 101,
          categoryId: faker.helpers.arrayElement(categories).categoryId,
          startDate,
          endDate,
          title,
          place: faker.helpers.arrayElement(this.locationTemplates),
          isAllDay,
        };

        if (faker.datatype.boolean(0.2)) {
          schedule['memo'] = faker.helpers.arrayElement(this.memoTemplates);
        }

        schedules.push(schedule);
      }
    }

    await dataSource.transaction(async (transactionalEntityManager) => {
      for (const schedule of schedules) {
        try {
          await transactionalEntityManager.save(Schedule, schedule);
          console.log(
            `일정 생성: ${schedule.title} (${schedule.startDate.toISOString()} - ${schedule.endDate.toISOString()})`,
          );
        } catch (error) {
          console.error(`일정 생성 중 오류 발생: ${schedule.title}`, error);
        }
      }
    });

    console.log(`총 ${schedules.length}개의 일정이 생성되었습니다.`);
  }
}
