export default function RecommendCard({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`recommend-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(plan)}
      aria-pressed={selected}
    >
      <h3 className="recommend-card__title">{plan.name}</h3>
      <ul className="recommend-card__tags">
        {plan.elements.map((el) => (
          <li key={el}>{el}</li>
        ))}
      </ul>
      <p className="recommend-card__reason">{plan.reason}</p>
    </button>
  );
}
