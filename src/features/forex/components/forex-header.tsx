'use client';

import { AppHeader } from '@/components/layout/app-header';

interface ForexHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function ForexHeader({ isRefreshing, onRefresh }: ForexHeaderProps) {
  return (
    <AppHeader
      active="forex"
      badge="FOREX"
      subtitle="تحلیل تکنیکال چندتایم‌فریمی فارکس"
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
