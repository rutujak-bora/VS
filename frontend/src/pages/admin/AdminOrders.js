import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)));
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 border-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-4xl font-bold uppercase tracking-tight mb-8" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="orders-title">
          Orders
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 border-2 border-black" data-testid="no-orders">
            <p className="text-lg">No orders placed yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <div key={order.id} className="border-2 border-black" data-testid={`order-${idx}`}>
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-bold" data-testid={`order-id-${idx}`}>Order #{order.id.substring(0, 8)}</h3>
                        <span className={`px-3 py-1 text-xs uppercase tracking-widest font-bold border-2 ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-widest font-bold text-gray-600">Customer</p>
                          <p className="font-medium">{order.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest font-bold text-gray-600">Email</p>
                          <p>{order.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest font-bold text-gray-600">Date</p>
                          <p>{new Date(order.order_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest font-bold text-gray-600">Total</p>
                          <p className="font-bold">₹{order.total_amount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-6 h-6" strokeWidth={2} />
                      ) : (
                        <ChevronDown className="w-6 h-6" strokeWidth={2} />
                      )}
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t-2 border-black p-6 bg-gray-50">
                    <div className="mb-6">
                      <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Customer Details</h4>
                      <p><strong>Mobile:</strong> {order.customer_mobile}</p>
                      <p><strong>Address:</strong> {order.customer_address}</p>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase tracking-widest font-bold mb-4">Order Items</h4>
                      <div className="space-y-4">
                        {order.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex gap-4 bg-white p-4 border-2 border-black" data-testid={`order-item-${idx}-${itemIdx}`}>
                            <img
                              src={process.env.REACT_APP_BACKEND_URL + item.product_image}
                              alt={item.product_name}
                              className="w-20 h-24 object-cover border border-black"
                            />
                            <div className="flex-1">
                              <h5 className="font-bold mb-2">{item.product_name}</h5>
                              <p className="text-sm">Color: {item.selected_color}</p>
                              <p className="text-sm">Size: {item.selected_size}</p>
                              <p className="text-sm">Quantity: {item.quantity}</p>
                              <p className="text-sm font-bold mt-2">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}