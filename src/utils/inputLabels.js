import {
  AGE_GROUPS,
  ANXIETY_LEVELS,
  DURATIONS,
  RELIGIONS,
  SITUATIONS,
} from '../data/options';

function findLabel(list, id) {
  return list.find((x) => x.id === id)?.label ?? id;
}

/** 입력값을 발표용 요약 라벨로 변환 */
export function summarizeInput(input) {
  return {
    situation: findLabel(SITUATIONS, input.situation),
    age: findLabel(AGE_GROUPS, input.ageGroup),
    religion: findLabel(RELIGIONS, input.religion),
    duration: findLabel(DURATIONS, input.duration),
    anxiety: findLabel(ANXIETY_LEVELS, input.anxiety),
  };
}
