interface LoadingStateProps {
  message: string;
}

export const LoadingState = ({ message }: LoadingStateProps) => (
  <div className="card p-6 text-sm text-slate-700">{message}</div>
);
