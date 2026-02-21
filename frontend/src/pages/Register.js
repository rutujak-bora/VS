import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken, setCustomer } from '../utils/api';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      setAuthToken(response.data.token);
      setCustomer(response.data.customer);
      toast.success('Registration successful!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-medium tracking-tight mb-4" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="brand-title">
            VS Fashion
          </h1>
          <p className="text-base md:text-lg tracking-wide text-muted-foreground">Begin your luxury fashion journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" data-testid="register-form">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50"
                placeholder="Enter your full name"
                data-testid="input-name"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50"
                placeholder="Enter mobile number"
                data-testid="input-mobile"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50"
                placeholder="Enter email address"
                data-testid="input-email"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50"
                placeholder="Create a password"
                data-testid="input-password"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Address</label>
            <div className="relative">
              <MapPin className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50 resize-none"
                placeholder="Enter your address"
                rows="2"
                data-testid="input-address"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-none uppercase tracking-widest text-xs font-bold px-8 py-4 bg-primary text-primary-foreground hover:bg-transparent hover:text-primary border border-primary transition-all duration-300 disabled:opacity-50"
            data-testid="register-submit-btn"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <p className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="underline-expand font-medium hover:text-primary" data-testid="login-link">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}