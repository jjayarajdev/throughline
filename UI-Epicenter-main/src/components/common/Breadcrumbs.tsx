'use client';

import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname(); // e.g. /home/hiring-management/HRQ1236
  const segments = pathname.split('/').filter(Boolean); // ['home', 'hiring-management', 'HRQ1236']
const router = useRouter()
  // Skip the 'home' segment from the path
  const filteredSegments = segments.filter((seg) => seg !== 'home');

  const getLabel = (segment: string) =>
    segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <nav className="text-sm  text-gray-600 flex items-center py-2 space-x-1">
      <Link href="/home/dashboard" className="text-green-600 hover:underline font-medium">
        Home
      </Link>

      {filteredSegments.map((segment, idx) => {
        const href = '/' + ['home', ...filteredSegments.slice(0, idx + 1)].join('/');
        const isLast = idx === filteredSegments.length - 1;

        return (
          <span key={href} className="flex items-center space-x-1">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {isLast ? (
              <span className="capitalize dark:text-white text-gray-800">{getLabel(segment)}</span>
            ) : (
              <div
              onClick={()=>router.back()}
            
                className="capitalize text-green-600 hover:cursor-pointer hover:underline"
              >
                {getLabel(segment)}
              </div>
            )}
          </span>
        );
      })}
    </nav>
  );
}
