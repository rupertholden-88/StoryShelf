import { StarIcon } from "./Icons";

export function Stars({ who, value, onChange }: { who: string; value: number; onChange?: (n: number) => void }) {
  if (!onChange) {
    return (
      <span className="stars" role="img" aria-label={`${who} rated it ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => <span key={n} className="star"><StarIcon on={n <= value} /></span>)}
      </span>
    );
  }
  return (
    <span className="stars" role="group" aria-label={`${who}'s rating`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star"
          aria-label={`${n} out of 5`}
          aria-pressed={n === value}
          onClick={() => onChange(n === value ? 0 : n)}
        >
          <StarIcon on={n <= value} />
        </button>
      ))}
    </span>
  );
}
