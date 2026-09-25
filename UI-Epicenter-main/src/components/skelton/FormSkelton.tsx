import React from 'react';

const SkeletonForm = () => {
  const fields = [
    'Role Hired For', 'RM Owner', 'Hiring Manager', 'HRQ ID',
    'RCMS Project ID', 'RCMS Resource Request ID', 'Project Name', 'Business Unit',
    'Request Start Date', 'Req Creation Date', 'Hiring Type', 'Project Duration (Months)',
    'Status', 'Mention Approver Email'
  ];

  return (
    <div className="animate-pulse p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {fields.map((label) => (
        <div key={label} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}

      {/* Position Category Toggle */}
      <div className="col-span-1 lg:col-span-2 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="flex items-center space-x-4">
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonForm;
