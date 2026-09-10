import type { ReactNode } from 'react';

export const EmptyState = ({ message, icon = '✓' }: { message: string, icon?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-100 text-center">
    <div className="text-4xl mb-3 text-gray-300">{icon}</div>
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);
