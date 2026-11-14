import { orderStep } from '../../lib/orderStatus';

export function OrderStepButtons({ transitions = [], pending, onStep }) {
  if (!transitions.length) return <p className="admin-muted">No further steps.</p>;
  return (
    <div className="admin-step-row">
      {transitions.map((status) => {
        const [tone, label] = orderStep(status);
        return (
          <button
            key={status}
            type="button"
            className={`admin-btn admin-btn-sm admin-btn-${tone}`}
            disabled={pending}
            onClick={() => onStep(status)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
