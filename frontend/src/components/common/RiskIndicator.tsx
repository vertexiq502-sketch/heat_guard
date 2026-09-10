
export const RiskIndicator = ({ level }: { level: string }) => {
  const colors: Record<string, string> = { green: 'bg-green-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500', red: 'bg-red-500' };
  return <div className={`p-4 rounded text-white font-bold ${colors[level] || 'bg-gray-500'}`}>Risk Level: {level.toUpperCase()}</div>;
};
