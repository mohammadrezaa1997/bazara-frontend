import type { Metadata } from 'next';

import { SmartPortfolioDashboard } from '@/features/smart-portfolio/components/smart-portfolio-dashboard';

export const metadata: Metadata = {
  title: 'پرتفوی هوشمند | BAZARA',
  description: 'پرتفوی چندبازاره بر حسب تومان و متناسب با پروفایل ریسک',
};

export default function SmartPortfolioPage() {
  return <SmartPortfolioDashboard />;
}
