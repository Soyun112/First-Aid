/** 데모용 이송 요청 · 환자 정보 (병원 시스템 연동 없음) */

export const DEMO_TRANSPORT_REQUEST = {
  id: 'demo-req-1',
  from: '8층 입원실',
  to: '지하 3층 MRI실',
  title: '환자 이송 요청',
  summary: '8층 입원실 → 지하 3층 MRI실',
};

/** 환자 정보 확인 화면에 자동으로 뜨는 값 */
export const DEMO_PATIENT = {
  name: '김OO',
  ageGroup: 'adult',
  ageLabel: '성인',
  from: DEMO_TRANSPORT_REQUEST.from,
  to: DEMO_TRANSPORT_REQUEST.to,
  bed: 'B-812',
  /** 이동 중 타이머용 (분) — 데모 기본 */
  durationMinutes: 5,
  durationId: '5',
};
