import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken, setCustomer } from '../utils/api';
import { toast } from 'sonner';
import { Mail, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetData, setResetData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      setAuthToken(response.data.token);
      setCustomer(response.data.customer);
      toast.success('Login successful!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: resetData.email,
        new_password: resetData.newPassword
      });
      toast.success('Password updated successfully! Please login with your new password.');
      setShowResetModal(false);
      setResetData({ email: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-medium tracking-tight mb-4" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="brand-title">
            VS Fashion
          </h1>
          <p className="text-base md:text-lg tracking-wide text-muted-foreground">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" data-testid="login-form">
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
                placeholder="Enter password"
                data-testid="input-password"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-xs uppercase tracking-widest font-bold hover:text-primary transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-none uppercase tracking-widest text-xs font-bold px-8 py-4 bg-primary text-primary-foreground hover:bg-transparent hover:text-primary border border-primary transition-all duration-300 disabled:opacity-50"
            data-testid="login-submit-btn"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="underline-expand font-medium hover:text-primary" data-testid="register-link">
              Register here
            </Link>
          </p>
        </form>
      </div>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-lg border-border border shadow-2xl p-12">
          <DialogHeader className="text-center mb-8">
            <DialogTitle className="text-3xl font-medium tracking-tight mb-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-sm tracking-wide text-muted-foreground">
              Enter your registered email and new password
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-8">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold mb-2 block text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="email"
                  required
                  value={resetData.email}
                  onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                  className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50 transition-colors"
                  placeholder="Registered email email"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest font-bold mb-2 block text-muted-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                  className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50 transition-colors"
                  placeholder="Create new password"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest font-bold mb-2 block text-muted-foreground">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-0 top-2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  value={resetData.confirmPassword}
                  onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                  className="w-full rounded-none border-b border-input bg-transparent pl-6 py-2 focus-visible:outline-none focus-visible:border-primary placeholder:text-muted-foreground/50 transition-colors"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading || !resetData.email || !resetData.newPassword || !resetData.confirmPassword}
              className="w-full rounded-none uppercase tracking-widest text-xs font-bold px-8 py-4 bg-primary text-primary-foreground hover:bg-transparent hover:text-primary border border-primary transition-all duration-300 disabled:opacity-50"
            >
              {resetLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}