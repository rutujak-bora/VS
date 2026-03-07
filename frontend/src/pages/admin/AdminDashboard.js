import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, customersRes, ordersRes] = await Promise.all([
        api.get('/products'),
        api.get('/admin/customers'),
        api.get('/admin/orders')
      ]);

      const revenue = ordersRes.data.reduce((sum, order) => sum + order.total_amount, 0);

      setStats({
        totalProducts: productsRes.data.length,
        totalCustomers: customersRes.data.length,
        totalOrders: ordersRes.data.length,
        totalRevenue: revenue
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-4xl font-bold uppercase tracking-tight mb-8" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="dashboard-title">
          Dashboard
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-2 border-black p-6" data-testid="stat-products">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8" strokeWidth={2} />
              </div>
              <p className="text-3xl font-bold mb-2">{stats.totalProducts}</p>
              <p className="text-xs uppercase tracking-widest font-bold">Total Products</p>
            </div>

            <div className="border-2 border-black p-6" data-testid="stat-customers">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8" strokeWidth={2} />
              </div>
              <p className="text-3xl font-bold mb-2">{stats.totalCustomers}</p>
              <p className="text-xs uppercase tracking-widest font-bold">Total Customers</p>
            </div>

            <div className="border-2 border-black p-6" data-testid="stat-orders">
              <div className="flex items-center justify-between mb-4">
                <ShoppingCart className="w-8 h-8" strokeWidth={2} />
              </div>
              <p className="text-3xl font-bold mb-2">{stats.totalOrders}</p>
              <p className="text-xs uppercase tracking-widest font-bold">Total Orders</p>
            </div>

            <div className="border-2 border-black p-6" data-testid="stat-revenue">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8" strokeWidth={2} />
              </div>
              <p className="text-3xl font-bold mb-2">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
              <p className="text-xs uppercase tracking-widest font-bold">Total Revenue</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}