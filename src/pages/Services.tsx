import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ServiceCard, { Service } from '../components/ServiceCard';
import serviceService from '../services/serviceService';
import { renderIconByName } from '../components/IconPicker';

// Service interface is imported from ServiceCard component

const Services: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Extract search query from URL parameters when component mounts or URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  // Fetch services when component mounts or search query changes
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await serviceService.getServices(searchQuery);
        setServices(data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setError('Failed to load services. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">Our Services</h1>
      
      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex">
            <input
              type="text"
              placeholder="Search for services..."
              className="w-full px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-indigo-600 px-4 rounded-r-md flex items-center justify-center hover:bg-indigo-700 text-white"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No services found matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service) => (
            <ServiceCard key={service._id} 
            service={{
              _id: service._id,
              name: service.name,
              description: service.description,
              price: `$${service.price}`,
              icon: service.iconName ? renderIconByName(service.iconName, "h-10 w-10 text-indigo-600") : undefined
            }} 
            showFullDetails={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;