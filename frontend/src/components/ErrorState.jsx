import { errorMessage } from '../utils/errors.js';

export default function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="card mx-auto max-w-md p-6 text-center">
      <p className="font-medium text-red-700">{errorMessage(error)}</p>
      {onRetry && (
        <button className="btn btn-secondary mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
