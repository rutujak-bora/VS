import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/admin/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-4xl font-bold uppercase tracking-tight mb-8" style={{fontFamily: 'Playfair Display, serif'}} data-testid="customers-title">
          Customers
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 border-2 border-black" data-testid="no-customers">
            <p className="text-lg">No customers registered yet</p>
          </div>
        ) : (
          <div className="border-2 border-black">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Name</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Email</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Mobile</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Address</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Registered On</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, idx) => (
                  <tr key={customer.id} className="border-b border-black" data-testid={`customer-row-${idx}`}>
                    <td className="p-4 font-medium">{customer.name}</td>
                    <td className="p-4">{customer.email}</td>
                    <td className="p-4">{customer.mobile}</td>
                    <td className="p-4">{customer.address}</td>
                    <td className="p-4">{new Date(customer.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}