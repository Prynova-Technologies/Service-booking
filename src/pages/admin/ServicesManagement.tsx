import React, { useState, useEffect } from 'react';
import adminServiceService, { AdminService, CreateServiceData, UpdateServiceData } from '../../services/adminServiceService';
import IconPicker, { renderIconByName } from '../../components/IconPicker';
import ServiceCard from '../../components/ServiceCard';

const ServicesManagement: React.FC = () => {
  // State for services list and loading status
  const [services, setServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for service modals
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [isDeleteServiceModalOpen, setIsDeleteServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AdminService | null>(null);

  // State for new service form
  const [newService, setNewService] = useState<CreateServiceData>({
    name: '',
    description: '',
    startingPrice: 0,
    iconName: ''
  });

  // Load services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch services from the service
  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedServices = await adminServiceService.getServices();
      
      setServices(fetchedServices);
    } catch (err) {
      setError('Failed to load services. Please try again.');
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes for new service
  const handleNewServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewService({ 
      ...newService, 
      [name]: name === 'startingPrice' ? parseFloat(value) || 0 : value 
    });
  };

  // Handle icon selection for new service
  const handleNewServiceIconSelect = (iconName: string) => {
    setNewService({
      ...newService,
      iconName
    });
  };

  // Handle form input changes for editing service
  const handleEditServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (selectedService) {
      setSelectedService({ 
        ...selectedService, 
        [name]: name === 'startingPrice' ? parseFloat(value) || 0 : value 
      } as AdminService);
    }
  };

  // Handle icon selection for editing service
  const handleEditServiceIconSelect = (iconName: string) => {
    if (selectedService) {
      setSelectedService({
        ...selectedService,
        iconName
      } as AdminService);
    }
  };

  // Handle adding a new service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminServiceService.createService(newService);
      setIsAddServiceModalOpen(false);
      // Reset form
      setNewService({
        name: '',
        description: '',
        startingPrice: 0,
        iconName: ''
      });
      // Refresh service list
      await fetchServices();
    } catch (err) {
      setError('Failed to add service. Please try again.');
      console.error('Error adding service:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating a service
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsLoading(true);
    try {
      const updateData: UpdateServiceData = {
        name: selectedService.name,
        description: selectedService.description,
        startingPrice: selectedService.price,
        iconName: selectedService.iconName
      };
      await adminServiceService.updateService(selectedService._id, updateData);
      setIsEditServiceModalOpen(false);
      // Refresh service list
      await fetchServices();
    } catch (err) {
      setError('Failed to update service. Please try again.');
      console.error('Error updating service:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a service
  const handleDeleteService = async () => {
    if (!selectedService) return;

    setIsLoading(true);
    try {
      await adminServiceService.deleteService(selectedService._id);
      setIsDeleteServiceModalOpen(false);
      // Refresh service list
      await fetchServices();
    } catch (err) {
      setError('Failed to delete service. Please try again.');
      console.error('Error deleting service:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Services Management</h2>
        <button
          onClick={() => setIsAddServiceModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Add New Service
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && services.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-stretch">
          {services.map((service) => (
            <div key={service._id} className="relative group w-full">
              <ServiceCard 
                service={{
                  id: service._id,
                  name: service.name,
                  description: service.description,
                  price: `$${service.price}`,
                  icon: service.iconName ? renderIconByName(service.iconName, "h-10 w-10 text-indigo-600") : undefined
                }} 
                showFullDetails={true}
                hideBookButton={true}
              />
              <div className="absolute top-2 right-2 flex space-x-1 bg-white rounded-md shadow p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setSelectedService(service);
                    setIsEditServiceModalOpen(true);
                  }}
                  className="p-1 text-indigo-600 hover:text-indigo-900"
                  title="Edit service"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setSelectedService(service);
                    setIsDeleteServiceModalOpen(true);
                  }}
                  className="p-1 text-red-600 hover:text-red-900"
                  title="Delete service"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {isAddServiceModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddService}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Service</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={newService.name}
                            onChange={handleNewServiceInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            name="description"
                            id="description"
                            required
                            value={newService.description}
                            onChange={handleNewServiceInputChange}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700">Starting Price ($)</label>
                          <input
                            type="number"
                            name="startingPrice"
                            id="startingPrice"
                            required
                            value={newService.startingPrice}
                            onChange={handleNewServiceInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label htmlFor="iconName" className="block text-sm font-medium text-gray-700">Service Icon</label>
                          <div className="mt-1">
                            <IconPicker
                              selectedIcon={newService.iconName || ''}
                              onSelectIcon={handleNewServiceIconSelect}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isLoading ? 'Adding...' : 'Add Service'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddServiceModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {isEditServiceModalOpen && selectedService && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateService}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Service</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            name="name"
                            id="edit-name"
                            required
                            value={selectedService.name}
                            onChange={handleEditServiceInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            name="description"
                            id="edit-description"
                            required
                            value={selectedService.description}
                            onChange={handleEditServiceInputChange}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-startingPrice" className="block text-sm font-medium text-gray-700">Starting Price ($)</label>
                          <input
                            type="number"
                            name="startingPrice"
                            id="edit-startingPrice"
                            required
                            value={selectedService.price}
                            onChange={handleEditServiceInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-iconName" className="block text-sm font-medium text-gray-700">Service Icon</label>
                          <div className="mt-1">
                            <IconPicker
                              selectedIcon={selectedService.iconName || ''}
                              onSelectIcon={handleEditServiceIconSelect}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isLoading ? 'Updating...' : 'Update Service'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditServiceModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Modal */}
      {isDeleteServiceModalOpen && selectedService && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Service</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the service "{selectedService.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleDeleteService}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteServiceModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;