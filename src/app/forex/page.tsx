import type { Metadata } from 'next';

import { ForexDashboard } from '@/features/forex/components/forex-dashboard';

export const metadata: Metadata = {
  title: 'فارکس | BAZARA',
  description:
    'نمودار تکنیکال، تحلیل چندتایم‌فریمی و مدیریت ریسک فارکس',
};

export default function ForexPage() {
  return <ForexDashboard />;
}