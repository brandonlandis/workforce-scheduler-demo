interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="card p-8 text-center">
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    <p className="mt-1 text-sm text-slate-600">{description}</p>
  </div>
);
