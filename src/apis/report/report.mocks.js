// 리포트가 없는 신규 유저(RR404) 테스트용 mock
export const reportMonthlyApiMockRR404Error = {
  success: false,
  responseDto: null,
  error: {
    code: "RR404",
    message: "Report: User has no report data",
  },
};

// 리포트는 200으로 내려오지만 내용이 비어있는 신규 유저 케이스
export const reportMonthlyApiMockEmptyData = {
  success: true,
  error: null,
  responseDto: {
    character: null, // 캐릭터 비었으면 empty_data
    characterNum: 0,
    userTotalNum: 0,

    data: {
      code: "EMPTY_FINISH", // 완독 비었음
      data: {}, // 연도/월 맵 비어있음
    },

    logData: {
      code: "EMPTY_LOG", // 기록 비었음
      data: {}, // 연도/월 맵 비어있음
    },
  },
};

// 이번달 가입 유저라서 지난달 데이터 없어서 캐릭터 없음
// 근데 이번달에 완독 및 독서기록 있음
export const reportMonthlyApiMockThisMonthHasDataNoCharacter = {
  success: true,
  error: null,
  responseDto: {
    character: {
      manyPlace: "empty_data",
      readingTendency: "empty_data",
    },
    userRegisterDate: "2026-01-01T00:00:00",
    characterNum: 0,
    userTotalNum: 0,
    data: {
      code: "OK",
      data: {
        2026: {
          1: [
            {
              finishAt: "2026-01-06T21:10:00",
              category: "소설/문학",
              hashtags: ["몰입", "여운"],
            },
            {
              finishAt: "2026-01-09T18:40:00",
              category: "자기계발",
              hashtags: ["루틴", "동기부여"],
            },
          ],
        },
      },
    },

    logData: {
      code: "OK",
      data: {
        2026: {
          1: [
            {
              readAt: "2026-01-03T09:30:00",
              category: "소설/문학",
              place: "HOME",
            },
            {
              readAt: "2026-01-05T13:10:00",
              category: "소설/문학",
              place: "CAFE",
            },
            {
              readAt: "2026-01-07T20:20:00",
              category: "자기계발",
              place: "HOME",
            },
            {
              readAt: "2026-01-10T08:15:00",
              category: "자기계발",
              place: "MOVING",
            },
          ],
        },
      },
    },
  },
};

// 재은이 mock 데이터
export const reportMonthlyApiMockParkHaru = {
  success: true,
  error: null,
  responseDto: {
    character: {
      manyPlace: "empty_data",
      readingTendency: "empty_data",
    },
    userRegisterDate: "2026-01-01T00:00:00",
    characterNum: 0,
    userTotalNum: 0,
    data: {
      code: "OK",
      data: {
        2026: {
          1: [
            {
              finishAt: "2026-01-13T00:00:00",
              category: "소설/문학",
              hashtags: ["스릴 있는", "어려운", "비유적인"],
            },
            {
              finishAt: "2026-01-09T07:14:54",
              category: "엔터테인먼트/문화",
              hashtags: ["여운이 남는", "다시 읽고 싶은", "한 번에 읽은"],
            },
          ],
        },
        2025: {
          12: [
            {
              finishAt: "2025-12-14T00:00:00",
              category: "소설/문학",
              hashtags: ["여운이 남는", "잘 읽히는", "속도감 있는 전개"],
            },
            {
              finishAt: "2025-12-09T00:00:00",
              category: "소설/문학",
              hashtags: ["무거운", "어려운", "사실적인"],
            },
            {
              finishAt: "2025-12-26T00:00:00",
              category: "소설/문학",
              hashtags: ["여운이 남는", "잘 읽히는", "속도감 있는 전개"],
            },
            {
              finishAt: "2025-12-11T00:00:00",
              category: "소설/문학",
              hashtags: ["여운이 남는", "다시 읽고 싶은", "간결한"],
            },
            {
              finishAt: "2025-12-01T00:00:00",
              category: "소설/문학",
              hashtags: ["여운이 남는", "한 번에 읽은", "속도감 있는 전개"],
            },
            {
              finishAt: "2025-12-19T00:00:00",
              category: "소설/문학",
              hashtags: ["스릴 있는", "어려운", "비유적인"],
            },
          ],
          9: [
            {
              finishAt: "2025-09-16T00:00:00",
              category: "과학/기술/공학",
              hashtags: ["무거운", "어려운", "집중이 필요한"],
            },
            {
              finishAt: "2025-09-21T00:00:00",
              category: "소설/문학",
              hashtags: ["여운이 남는", "생각하게 되는", "다시 읽고 싶은"],
            },
          ],
          10: [
            {
              finishAt: "2025-10-05T00:00:00",
              category: "엔터테인먼트/문화",
              hashtags: ["출퇴근길에 딱", "한 번에 읽은", "간결한"],
            },
          ],
        },
      },
    },
    logData: {
      code: "OK",
      data: {
        2026: {
          1: [
            {
              readAt: "2026-01-09T09:58:52",
              category: "소설/문학",
              place: "LIBRARY",
            },
            {
              readAt: "2026-01-14T12:58:56",
              category: "소설/문학",
              place: "HOME",
            },
            {
              readAt: "2026-01-14T13:00:05",
              category: "소설/문학",
              place: "CAFE",
            },
            {
              readAt: "2026-01-16T15:50:35",
              category: "소설/문학",
              place: "LIBRARY",
            },
            {
              readAt: "2026-01-09T06:43:05",
              category: "소설/문학",
              place: "MOVING",
            },
            {
              readAt: "2026-01-09T06:43:19",
              category: "소설/문학",
              place: "HOME",
            },
            {
              readAt: "2026-01-10T01:23:43",
              category: "소설/문학",
              place: "MOVING",
            },
            {
              readAt: "2026-01-09T06:42:54",
              category: "엔터테인먼트/문화",
              place: "CAFE",
            },
            {
              readAt: "2026-01-09T06:43:24",
              category: "엔터테인먼트/문화",
              place: "CAFE",
            },
          ],
        },
      },
    },
  },
};

// 정상 리포트 mock 데이터
export const reportMonthlyApiMock = {
  success: true,
  error: null,
  responseDto: {
    character: {
      manyPlace: "MOVING", // 가장 많이 읽은 장소
      readingTendency: "경제/경영", // 장르
    },
    userTotalNum: 100, // 전체 유저 수
    characterNum: 15, // 해당 캐릭터 유저 수3

    data: {
      code: "OK",
      // 연도 > 월 > 독서 배열 순서
      data: {
        2024: {
          11: [
            {
              finishAt: "2024-11-03T09:20:00",
              category: "소설/문학",
              hashtags: ["잔잔함", "여운"],
            },
            {
              finishAt: "2024-11-18T22:10:00",
              category: "에세이/전기",
              hashtags: ["공감", "힐링"],
            },
          ],
          12: [
            {
              finishAt: "2024-12-01T14:30:00",
              category: "인문/사회/정치/법",
              hashtags: ["집중", "사색"],
            },
          ],
        },

        2025: {
          1: [
            {
              finishAt: "2025-01-05T08:40:00",
              category: "심리/명상",
              hashtags: ["동기부여", "정리"],
            },
            {
              finishAt: "2025-01-21T19:10:00",
              category: "소설/문학",
              hashtags: ["몰입", "재미"],
            },
          ],

          6: [
            {
              finishAt: "2025-06-02T07:55:00",
              category: "소설/문학",
              hashtags: ["속도감"],
            },
            {
              finishAt: "2025-06-15T18:30:00",
              category: "인문/사회/정치/법",
              hashtags: ["사고확장"],
            },
            {
              finishAt: "2025-06-15T20:30:00",
              category: "인문/사회/정치/법",
              hashtags: ["사고확장"],
            },
            {
              finishAt: "2025-06-28T23:10:00",
              category: "에세이/전기",
              hashtags: ["위로"],
            },
          ],

          12: [
            {
              finishAt: "2025-12-11T19:14:20",
              category: "소설/문학",
              hashtags: ["재밌음", "흥미진진", "빠른전개"],
            },
            {
              finishAt: "2025-12-10T21:40:00",
              category: "인문/사회/정치/법",
              hashtags: ["여운", "몰입"],
            },
            {
              finishAt: "2025-12-22T10:05:00",
              category: "심리/명상",
              hashtags: ["정리", "성장"],
            },
            {
              finishAt: "2025-12-03T08:10:00",
              category: "경제/경영",
              hashtags: ["투자", "인사이트"],
            },
            {
              finishAt: "2025-12-05T23:20:00",
              category: "과학/기술/공학",
              hashtags: ["신기함", "호기심", "설렘"],
            },
            {
              finishAt: "2025-12-07T12:40:00",
              category: "예술/디자인/건축",
              hashtags: ["감성", "영감"],
            },
            {
              finishAt: "2025-12-15T17:35:00",
              category: "의학/건강",
              hashtags: ["루틴", "힐링"],
            },
            {
              finishAt: "2025-12-15T18:35:00",
              category: "의학/건강",
              hashtags: ["루틴", "힐링"],
            },
            {
              finishAt: "2025-12-18T09:50:00",
              category: "여행",
              hashtags: ["설렘", "계획"],
            },
          ],
        },
      },
    },

    // 로그 데이터 (readAt / category / place)
    logData: {
      code: "OK",
      data: {
        2024: {
          11: [
            {
              readAt: "2024-11-03T09:20:00",
              category: "소설/문학",
              place: "HOME",
            },
            {
              readAt: "2024-11-18T22:10:00",
              category: "에세이/전기",
              place: "CAFE",
            },
          ],
          12: [
            {
              readAt: "2024-12-01T14:30:00",
              category: "인문/사회/정치/법",
              place: "LIBRARY",
            },
          ],
        },

        2025: {
          1: [
            {
              readAt: "2025-01-05T08:40:00",
              category: "심리/명상",
              place: "HOME",
            },
            {
              readAt: "2025-01-21T19:10:00",
              category: "소설/문학",
              place: "CAFE",
            },
          ],

          6: [
            {
              readAt: "2025-06-02T07:55:00",
              category: "소설/문학",
              place: "MOVING",
            },
            {
              readAt: "2025-06-15T18:30:00",
              category: "인문/사회/정치/법",
              place: "MOVING",
            },
            {
              readAt: "2025-06-15T20:30:00",
              category: "인문/사회/정치/법",
              place: "MOVING",
            },
            {
              readAt: "2025-06-28T23:10:00",
              category: "에세이/전기",
              place: "HOME",
            },
          ],

          12: [
            {
              readAt: "2025-12-11T19:14:20",
              category: "소설/문학",
              place: "MOVING",
            },
            {
              readAt: "2025-12-10T21:40:00",
              category: "인문/사회/정치/법",
              place: "MOVING",
            },
            {
              readAt: "2025-12-22T10:05:00",
              category: "심리/명상",
              place: "CAFE",
            },
            {
              readAt: "2025-12-03T08:10:00",
              category: "경제/경영",
              place: "HOME",
            },
            {
              readAt: "2025-12-05T23:20:00",
              category: "과학/기술/공학",
              place: "CAFE",
            },
            {
              readAt: "2025-12-07T12:40:00",
              category: "예술/디자인/건축",
              place: "LIBRARY",
            },
            {
              readAt: "2025-12-15T17:35:00",
              category: "의학/건강",
              place: "MOVING",
            },
            {
              readAt: "2025-12-15T18:35:00",
              category: "의학/건강",
              place: "MOVING",
            },
            {
              readAt: "2025-12-18T09:50:00",
              category: "여행",
              place: "HOME",
            },
          ],
        },
      },
    },
  },
};
