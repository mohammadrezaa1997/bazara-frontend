import type { Metadata } from 'next';

import { IranMarketDashboard } from '@/features/iran-market/components/iran-market-dashboard';

export const metadata: Metadata = {
  title: 'بازار ایران | BAZARA',
  description: 'رصد و تحلیل هوشمند ارز، طلا، سکه و بورس ایران',
};

export default function IranMarketPage() {
  return <IranMarketDashboard />;
}