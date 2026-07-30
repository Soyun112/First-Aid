import { AGE_GROUPS, DURATIONS } from '../data/options';

function findLabel(list, id) {
  return list.find((x) => x.id === id)?.label ?? id;
}

/** 입력값을 발표용 요약 라벨로 변환 */
export function summarizeInput(input) {
  return {
    age: findLabel(AGE_GROUPS, input.ageGroup),
    duration: findLabel(DURATIONS, input.duration),
  };
}
