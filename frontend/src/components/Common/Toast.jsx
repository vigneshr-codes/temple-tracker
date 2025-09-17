import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { removeNotification } from '../../features/ui/uiSlice';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Toast = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.ui);

  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.autoClose !== false) {
        setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration || 5000);
      }
    });
  }, [notifications, dispatch]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            notification.type === 'success'
              ? 'bg-green-50 border-l-4 border-green-400'
              : notification.type === 'error'
              ? 'bg-red-50 border-l-4 border-red-400'
              : notification.type === 'warning'
              ? 'bg-yellow-50 border-l-4 border-yellow-400'
              : 'bg-blue-50 border-l-4 border-blue-400'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-1">
                {notification.title && (
                  <p className={`text-sm font-medium ${
                    notification.type === 'success'
                      ? 'text-green-800'
                      : notification.type === 'error'
                      ? 'text-red-800'
                      : notification.type === 'warning'
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}>
                    {notification.title}
                  </p>
                )}
                <p className={`text-sm ${
                  notification.type === 'success'
                    ? 'text-green-700'
                    : notification.type === 'error'
                    ? 'text-red-700'
                    : notification.type === 'warning'
                    ? 'text-yellow-700'
                    : 'text-blue-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className={`inline-flex rounded-md ${
                    notification.type === 'success'
                      ? 'text-green-400 hover:text-green-500 focus:text-green-500'
                      : notification.type === 'error'
                      ? 'text-red-400 hover:text-red-500 focus:text-red-500'
                      : notification.type === 'warning'
                      ? 'text-yellow-400 hover:text-yellow-500 focus:text-yellow-500'
                      : 'text-blue-400 hover:text-blue-500 focus:text-blue-500'
                  } focus:outline-none`}
                  onClick={() => dispatch(removeNotification(notification.id))}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;