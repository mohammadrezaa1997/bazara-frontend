'use client';

import { AppHeader } from '@/components/layout/app-header';

interface MarketHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function MarketHeader({ isRefreshing, onRefresh }: MarketHeaderProps) {
  return (
    <AppHeader
      active="iran"
      badge="IRAN MARKET"
      subtitle="تحلیل چندمنبعی بازار مالی ایران"
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      maxWidthClass="max-w-[1440px]"
    />
  );
}
