// src/components/StatusBadge.tsx
import React from 'react';
import { BadgeCheck, AlertCircle, XCircle } from 'lucide-react';
import type { CommunionStatus } from '../types/models';

interface Props {
  status: CommunionStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const config = {
    ACTIVE: {
      bg: 'rgba(46,204,113,0.12)',
      border: 'rgba(46,204,113,0.4)',
      color: '#2ecc71',
      icon: <BadgeCheck className="h-3.5 w-3.5 inline-block mr-1" />,
    },
    IRREGULAR: {
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.4)',
      color: '#f59e0b',
      icon: <AlertCircle className="h-3.5 w-3.5 inline-block mr-1" />,
    },
    NONE: {
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.4)',
      color: '#ef4444',
      icon: <XCircle className="h-3.5 w-3.5 inline-block mr-1" />,
    },
  } as const;

  const c = config[status] ?? config.NONE;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.color }}
    >
      {c.icon}
      {status}
    </span>
  );
};
