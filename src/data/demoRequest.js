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
  /** ETA API용 구조화 값 (환자 확인 → /predict) */
  startFloor: 8,
  destination: 'MRI',
  destinationFloor: -3,
  /** ETA 로드 전 타이머/멘트 임시값 (분) — 실제로는 AI ETA로 덮어씀 */
  durationMinutes: 5,
  durationId: '5',
};
