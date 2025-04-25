import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';
import Header from './components/Layout/Header';
import Home from './pages/Home';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingForm from './pages/BookingForm';
import BookingDetails from './pages/BookingDetails';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationPermission from './components/NotificationPermission';
import { registerServiceWorker } from './serviceWorkerRegistration';

// HeaderWrapper component to conditionally render the header
const HeaderWrapper = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (isAuthPage || isAdminPage) return null;
  
  return isHomePage ? (
    <div className="hidden sm:block">
      <Header />
    </div>
  ) : (
    <Header />
  );
};

// AppContent component to handle initialization logic
const AppContent = () => {
  useEffect(() => {
    // Register service worker when the app starts
    registerServiceWorker();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Routes>
        <Route path="*" element={<HeaderWrapper />} />
      </Routes>
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/book/:serviceId" element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          } />
          <Route path="/booking-form/:serviceId" element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bookings/:id" element={
            <ProtectedRoute>
              <BookingDetails />
            </ProtectedRoute>
          } />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
        </Routes>
      </main>
      
      {/* Notification permission prompt */}
      <NotificationPermission />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App
