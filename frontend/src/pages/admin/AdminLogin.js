import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/admin/login', formData);
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-medium tracking-tight mb-4" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="admin-title">
            VS Fashion
          </h1>
          <p className="text-base md:text-lg tracking-wide uppercase font-bold">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 border-2 border-black p-8" data-testid="admin-login-form">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-0 top-3 w-4 h-4" strokeWidth={2} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border-b-2 border-black bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-black placeholder:text-gray-400"
                placeholder="admin@example.com"
                data-testid="admin-email-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-0 top-3 w-4 h-4" strokeWidth={2} />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border-b-2 border-black bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-black placeholder:text-gray-400"
                placeholder="••••••••"
                data-testid="admin-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full uppercase tracking-widest text-xs font-bold px-8 py-4 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300 disabled:opacity-50"
            data-testid="admin-login-btn"
          >
            {loading ? 'Logging in...' : 'Admin Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          <a href="/home" className="underline hover:no-underline">Back to store</a>
        </p>
      </div>
    </div>
  );
}