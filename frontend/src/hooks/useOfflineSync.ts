// src/hooks/useOfflineSync.ts
import { useState, useEffect } from 'react';

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Pending Sync'>('Synced');

  const queueSubmission = (data: any) => {
    const queue = JSON.parse(localStorage.getItem('offline_parishioner_queue') || '[]');
    queue.push(data);
    localStorage.setItem('offline_parishioner_queue', JSON.stringify(queue));
    setSyncStatus('Pending Sync');
  };

  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('offline_parishioner_queue') || '[]');
    if (queue.length > 0) {
      setSyncStatus('Pending Sync');
    }
  }, []);

  return {
    queueSubmission,
    syncStatus,
  };
}
