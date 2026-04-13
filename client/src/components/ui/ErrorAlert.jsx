import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div className="glass-card p-6 border-red-500/30 bg-red-500/5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <HiOutlineExclamationTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-red-300 font-semibold mb-1">Something went wrong</h3>
          <p className="text-dark-400 text-sm">{message || 'An unexpected error occurred.'}</p>
          {onRetry && (
            <button onClick={onRetry} className="mt-3 btn-secondary text-sm py-2 px-4">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
