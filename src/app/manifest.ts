import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/dashboard',
    name: 'بازارا | تحلیل بازار و سبد ترکیبی',
    short_name: 'بازارا',
    description: 'تحلیل بازار ایران، رمزارز و فارکس در یک تجربه یکپارچه',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#07111f',
    theme_color: '#07111f',
    lang: 'fa',
    dir: 'rtl',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      {
        src: '/icon.png',
        sizes: '1254x1254',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '1254x1254',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
