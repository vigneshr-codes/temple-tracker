import { useSelector } from 'react-redux';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { canAccessModule } from '../../utils/permissions';

const Reports = () => {
  const { user } = useSelector((state) => state.auth);

  // Check if user has access to the reports module
  if (!canAccessModule(user, 'reports')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access the reports module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Reports</h3>
          <p className="mt-2 text-sm text-gray-500">
            Financial reports and analytics dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;