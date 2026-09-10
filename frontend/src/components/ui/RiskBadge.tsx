export const RiskBadge = ({ level, label, className = '' }: { level: string, label?: string, className?: string }) => {
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  if (level === 'green') colorClass = 'bg-green-100 text-green-800 border-green-200';
  if (level === 'yellow') colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (level === 'orange') colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
  if (level === 'red') colorClass = 'bg-red-100 text-red-800 border-red-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded font-bold text-xs uppercase tracking-wider border ${colorClass} ${className}`}>
      {label || level}
    </span>
  );
};
