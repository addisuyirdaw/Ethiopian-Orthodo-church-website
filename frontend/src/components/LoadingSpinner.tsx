// src/components/LoadingSpinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return <Loader2 className="animate-spin h-5 w-5 text-accent" />;
};
