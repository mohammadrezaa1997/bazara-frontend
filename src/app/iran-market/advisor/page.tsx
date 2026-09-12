import type { Metadata } from 'next';

import { IranMarketAdvisorDashboard } from '@/features/iran-market/components/advisor/iran-market-advisor-dashboard';

export const metadata: Metadata = {
  title: 'مشاور بازار ایران | BAZARA',
  description: 'پیشنهاد قابل توضیح خرید، فروش، نگهداری و پایش بازار ایران',
};

export default function IranMarketAdvisorPage() {
  return <IranMarketAdvisorDashboard />;
}

