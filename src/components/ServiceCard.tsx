import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export interface Service {
  _id?: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  icon?: React.ReactNode;
}

interface ServiceCardProps {
  service: Service;
  showFullDetails?: boolean;
  hideBookButton?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, showFullDetails = true, hideBookButton = false }) => {
  const navigate = useNavigate();

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      // Redirect to login page if not authenticated
      navigate('/login');
      return;
    }
    
    
    // If authenticated, navigate to booking form
    navigate(service._id ? `/booking-form/${service._id}` : '/booking-form');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-indigo-100 w-full">
      {service.imageUrl ? (
        <div 
          className="h-32 sm:h-40 bg-gray-100" 
          style={{ backgroundImage: `url(${service.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        ></div>
      ) : (
        <div className="h-32 sm:h-40 bg-gray-100 flex items-center justify-center">
          {service.icon}
        </div>
      )}
      <div className="p-4 sm:p-5">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">{service.name}</h3>
        {showFullDetails && service.description && (
          <p className="text-gray-600 text-sm sm:text-base mb-3 line-clamp-2">
            {service.description}
          </p>
        )}
        {!showFullDetails && (
          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4">
            Professional {service.name.toLowerCase()} services
          </p>
        )}
        <div className="flex justify-between items-center">
          {showFullDetails && service.price && (
            <span className="text-indigo-600 font-medium text-sm sm:text-base">Starting Price: {service.price.replace(/^₦/, '')}</span>
          )}
          {!hideBookButton && (
            <button 
              onClick={handleBookClick}
              className={`bg-indigo-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-indigo-700 transition-colors ${(!showFullDetails || !service.price) ? 'w-full text-center' : ''}`}
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;