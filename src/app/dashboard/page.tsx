import type { Metadata } from 'next';

import { CryptoMarketDashboard } from '@/features/crypto/components/crypto-market-dashboard';

export const metadata: Metadata = {
  title: 'رمزارزها | BAZARA',
  description: 'نمودار حرفه‌ای و تحلیل مستقل بازار رمزارز',
};

export default function DashboardPage() {
  return <CryptoMarketDashboard />;
}
