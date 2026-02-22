import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCustomer, clearAuth, api, getToken, hasAccount, getAdmin } from '../utils/api';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = getCustomer();
  const admin = getAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const token = getToken();
      if (token) {
        const response = await api.get('/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const count = response.data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (error) {
      console.log('Cart fetch failed');
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/shop', label: 'Shop' },
    { path: '/contact', label: 'Contact Us' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2" data-testid="brand-logo">
            <img
              src="/images/logo.png"
              alt="VS Fashion Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          {/* Center Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link text-sm font-medium tracking-wide transition-colors ${isActive(link.path) ? 'text-[#8B1B4A] active' : 'text-gray-700 hover:text-[#8B1B4A]'
                  }`}
                data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Cart */}
            <Link to="/cart" className="relative text-gray-700 hover:text-[#8B1B4A] transition-colors" data-testid="cart-icon">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#8B1B4A] text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Customer Name */}
            {customer && (
              <div className="hidden md:flex items-center gap-2">
                <User className="w-5 h-5 text-[#8B1B4A]" />
                <span className="text-sm text-gray-700 font-medium" data-testid="customer-name">
                  {customer.name.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-gray-500 hover:text-[#8B1B4A] transition-colors ml-2"
                  data-testid="logout-btn"
                >
                  (Logout)
                </button>
              </div>
            )}

            {/* Sign In Button for Guests */}
            {!customer && (
              <Link
                to={hasAccount() ? "/login" : "/register"}
                className="text-sm font-medium text-white bg-[#8B1B4A] hover:bg-[#6B1539] px-6 py-2 transition-colors duration-300"
                data-testid="header-signin-btn"
              >
                Sign In
              </Link>
            )}

            {/* Dashboard Link - Only visible if admin is logged in */}
            {admin && (
              <Link
                to="/admin/dashboard"
                className="hidden md:block text-sm font-medium text-[#8B1B4A] border border-[#8B1B4A] px-3 py-1.5 rounded bg-[#8B1B4A]/5 hover:bg-[#8B1B4A]/10 transition-colors"
                data-testid="nav-admin-dashboard"
              >
                Dashboard
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white slide-in">
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-base font-medium tracking-wide ${isActive(link.path) ? 'text-[#8B1B4A]' : 'text-gray-700'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {admin && (
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/admin/dashboard"
                  className="block text-base font-medium text-[#8B1B4A]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              </div>
            )}

            {!customer && (
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to={hasAccount() ? "/login" : "/register"}
                  className="block text-base font-medium text-[#8B1B4A]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}

            {customer && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-[#8B1B4A]" />
                  <span className="text-sm text-gray-600">Hi, {customer.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-500"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
