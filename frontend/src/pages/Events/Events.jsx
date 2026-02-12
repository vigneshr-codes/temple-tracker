import { useState, useEffect, Fragment, lazy, Suspense, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { getEvents, createEvent, updateEvent, deleteEvent, reset } from '../../features/events/eventSlice';
import { addNotification } from '../../features/ui/uiSlice';
import { hasPermission, canAccessModule } from '../../utils/permissions';
import { TamilDateDisplay } from '../../components/TamilCalendar';

// Lazy load the heavy Tamil Calendar component
const TamilYearCalendar = lazy(() => import('../../components/TamilCalendar/TamilYearCalendar'));

const Events = () => {
  const dispatch = useDispatch();
  const { events, isLoading, isError, message, totalCount } = useSelector(
    (state) => state.events
  );
  const { user: currentUser } = useSelector((state) => state.auth);

  // Check if user can access events module
  if (!canAccessModule(currentUser, 'events')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view events.
          </p>
        </div>
      </div>
    );
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const [formData, setFormData] = useState({
    name: '',
    type: 'festival',
    date: '',
    description: '',
    isRecurring: false,
    recurringPattern: {
      frequency: 'yearly',
      interval: 1,
      endDate: ''
    }
  });

  useEffect(() => {
    dispatch(getEvents());
  }, [dispatch]);

  useEffect(() => {
    if (isError && message) {
      dispatch(addNotification({
        type: 'error',
        message: message
      }));
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  const eventTypes = [
    { value: 'new-moon', label: 'New Moon' },
    { value: 'full-moon', label: 'Full Moon' },
    { value: 'guru-poojai', label: 'Guru Poojai' },
    { value: 'uthira-nakshatram', label: 'Uthira Nakshatram' },
    { value: 'adi-ammavasai', label: 'Adi Ammavasai' },
    { value: 'festival', label: 'Festival' },
    { value: 'special', label: 'Special Event' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasPermission(currentUser, 'events', editingEvent ? 'update' : 'create')) {
      dispatch(addNotification({
        type: 'error',
        message: `You don't have permission to ${editingEvent ? 'update' : 'create'} events.`
      }));
      return;
    }

    try {
      if (editingEvent) {
        await dispatch(updateEvent({ id: editingEvent._id, eventData: formData })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Event updated successfully!'
        }));
      } else {
        await dispatch(createEvent(formData)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Event created successfully!'
        }));
      }
      
      handleCloseModal();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to save event'
      }));
    }
  };

  const handleDelete = async (eventId) => {
    if (!hasPermission(currentUser, 'events', 'delete')) {
      dispatch(addNotification({
        type: 'error',
        message: "You don't have permission to delete events."
      }));
      return;
    }

    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await dispatch(deleteEvent(eventId)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Event deleted successfully!'
        }));
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: error || 'Failed to delete event'
        }));
      }
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      type: event.type,
      date: new Date(event.date).toISOString().split('T')[0],
      description: event.description || '',
      isRecurring: event.isRecurring || false,
      recurringPattern: {
        frequency: event.recurringPattern?.frequency || 'yearly',
        interval: event.recurringPattern?.interval || 1,
        endDate: event.recurringPattern?.endDate ? 
          new Date(event.recurringPattern.endDate).toISOString().split('T')[0] : ''
      }
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({
      name: '',
      type: 'festival',
      date: '',
      description: '',
      isRecurring: false,
      recurringPattern: {
        frequency: 'yearly',
        interval: 1,
        endDate: ''
      }
    });
  };

  const filteredEvents = events.filter(event => {
    return event.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
           (filters.type === '' || event.type === filters.type) &&
           (filters.status === '' || event.status === filters.status);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage temple events, festivals, and special occasions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3">
          <div className="inline-flex rounded-lg shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                viewMode === 'list'
                  ? 'bg-temple-600 text-white border-temple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                viewMode === 'calendar'
                  ? 'bg-temple-600 text-white border-temple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Tamil Calendar
            </button>
          </div>
          {hasPermission(currentUser, 'events', 'create') && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-temple-600 to-saffron-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:ring-offset-2 transition-all sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-temple-500 focus:border-temple-500 sm:text-sm"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <select
          className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-temple-500 focus:outline-none focus:ring-temple-500"
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="">All Types</option>
          {eventTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select
          className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-temple-500 focus:outline-none focus:ring-temple-500 min-w-[120px]"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Events List or Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="mt-8">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-600"></div>
              <span className="ml-3 text-gray-600">Loading Tamil Calendar...</span>
            </div>
          }>
            <TamilYearCalendar year={new Date().getFullYear()} />
          </Suspense>
        </div>
      ) : (
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                        Loading events...
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                        No events found.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr key={event._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.name}</div>
                          {event.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {event.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-temple-100 text-temple-800">
                            {eventTypes.find(t => t.value === event.type)?.label || event.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <TamilDateDisplay 
                            date={event.date} 
                            variant="inline"
                            showFestivals={false}
                            showYear={true}
                            className="block"
                          />
                          {event.isRecurring && (
                            <div className="text-xs text-gray-500">Recurring</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.organizer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {hasPermission(currentUser, 'events', 'update') && (
                            <button
                              onClick={() => handleEdit(event)}
                              className="text-temple-600 hover:text-temple-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {hasPermission(currentUser, 'events', 'delete') && (
                            <button
                              onClick={() => handleDelete(event._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Event Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-75"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 will-change-auto" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-75"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all will-change-transform backface-visibility-hidden">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Event Name</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          required
                        >
                          {eventTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300 rounded"
                          checked={formData.isRecurring}
                          onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Recurring Event
                        </label>
                      </div>

                      {formData.isRecurring && (
                        <div className="space-y-2 pl-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Frequency</label>
                            <select
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                              value={formData.recurringPattern.frequency}
                              onChange={(e) => setFormData({
                                ...formData,
                                recurringPattern: {...formData.recurringPattern, frequency: e.target.value}
                              })}
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                              <option value="lunar-monthly">Lunar Monthly</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Interval</label>
                            <input
                              type="number"
                              min="1"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                              value={formData.recurringPattern.interval}
                              onChange={(e) => setFormData({
                                ...formData,
                                recurringPattern: {...formData.recurringPattern, interval: parseInt(e.target.value)}
                              })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                            <input
                              type="date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                              value={formData.recurringPattern.endDate}
                              onChange={(e) => setFormData({
                                ...formData,
                                recurringPattern: {...formData.recurringPattern, endDate: e.target.value}
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:ring-offset-2"
                        onClick={handleCloseModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gradient-to-r from-temple-600 to-saffron-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:ring-offset-2 transition-all"
                      >
                        {editingEvent ? 'Update' : 'Create'} Event
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Events;