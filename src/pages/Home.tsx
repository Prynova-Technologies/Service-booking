import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, MagnifyingGlassIcon, WrenchIcon, CalendarDaysIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import ServiceCard, { Service } from '../components/ServiceCard';
import serviceService from '../services/serviceService';
import NotificationCenter from '../components/NotificationCenter';
import authService from '../services/authService';
import { renderIconByName } from '../components/IconPicker';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to services page with search query
    navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
  };

  // Fetch popular services when component mounts
  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        setLoading(true);
        const services = await serviceService.getPopularServices(3);
        setPopularServices(services);
        setError('');
      } catch (err) {
        console.error('Failed to fetch popular services:', err);
        setError('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularServices();
    
    // Check authentication status
    setIsAuthenticated(authService.isAuthenticated());
    
    // Set up an event listener to update authentication status when it changes
    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    // Listen for storage events (for logout in other tabs)
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-8">
      {/* Mobile Header - Only visible on small screens */}
      <div className="sm:hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">BluePort Engineering</h1>
            <div className="flex items-center">
              <div className="mr-2">
                <NotificationCenter 
                  onNotificationClick={(notification) => {
                    // Navigate to the related content when notification is clicked
                    if (notification.type === 'booking_status' && notification.relatedId) {
                      navigate(`/bookings/${notification.relatedId}`);
                    }
                  }}
                />
              </div>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {isMenuOpen && (
            <div className="absolute right-4 mt-1 py-2 w-48 bg-white rounded-md shadow-lg text-gray-800 z-10">
              <Link to="/services" className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-600">
                <WrenchIcon className="h-5 w-5 mr-2 text-indigo-500" />
                Services
              </Link>
              {isAuthenticated && (
                <Link to="/bookings" className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-600">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  My Bookings
                </Link>
              )}
              <Link to="/login" className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-600">
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-indigo-500" />
                Login
              </Link>
              {/* Register link removed */}
            </div>
          )}

          <div className="text-md font-semibold mb-4">Book a profesional service in 3 simple steps</div>
          
          <form onSubmit={handleSearch} className="relative">
            <div className="flex">
              <input
                type="text"
                placeholder="Search for services..."
                className="w-full px-4 py-2 rounded-l-md text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-indigo-600 px-4 rounded-r-md flex items-center justify-center hover:bg-indigo-700"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600 hidden sm:block">Book Services with Ease</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 hidden sm:block">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Choose a Service</h3>
              <p className="text-gray-600">Browse through our wide range of professional services</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Select Date & Time</h3>
              <p className="text-gray-600">Pick a convenient date and time slot for your service</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Confirm Booking</h3>
              <p className="text-gray-600">Complete your booking and receive confirmation</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">Popular Services</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {popularServices.map((service) => (
                <ServiceCard 
                  key={service._id} 
                  service={{
                    _id: service._id,
                    name: service.name,
                    description: service.description,
                    price: `$${service.price}`,
                    icon: service.iconName ? renderIconByName(service.iconName, "h-10 w-10 text-indigo-600") : undefined
                  }} 
                  showFullDetails={false} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;