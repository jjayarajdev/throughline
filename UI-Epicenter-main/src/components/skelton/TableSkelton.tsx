import React, { FC } from 'react';

/**
 * A skeleton loader for table rows with highlighted headers using accent color,
 * supporting light and dark modes and built with Tailwind CSS and shadcn/ui conventions.
 */
const TableSkeletonLoader: FC = () => {
  const rows = Array.from({ length: 8 });
  const columns = [
    'HRQ ID', 'Business', 'RCMS ID', 'RR ID',
    'Project', 'Requester', 'Position',
    'Request Start Date', 'Status', 'RM Owner', 'Actions'
  ];

  return (

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              {columns.map((_, idx) => (
                <th
                  key={idx}
                  aria-hidden={true}
                  className="px-6 py-3 h-10 bg-teal-100 dark:bg-teal-800"
                />
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {/* Render a skeleton cell for each column */}
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-xs" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

  );
};

export default TableSkeletonLoader;
