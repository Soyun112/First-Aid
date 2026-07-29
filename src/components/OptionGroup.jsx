/**
 * 큰 터치 영역 옵션 그룹 (버튼/토글)
 */
export default function OptionGroup({
  label,
  options,
  value,
  onChange,
  optional = false,
}) {
  return (
    <fieldset className="option-group">
      <legend className="option-group__legend">
        {label}
        {optional && <span className="option-group__optional">선택</span>}
      </legend>
      <div className="option-group__grid" role="group" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`option-btn ${selected ? 'is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onChange(opt.id)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
