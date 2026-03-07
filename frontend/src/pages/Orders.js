import { useEffect, useState } from 'react';
import { api, getToken } from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/customer', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            // Sort by date desc
            setOrders(response.data.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)));
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
            case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-normal mb-8 tracking-tight text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                    My Orders
                </h1>

                {loading ? (
                    <div className="text-center py-24">Loading...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-gray-200">
                        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-medium text-gray-500">No orders yet</h2>
                        <p className="mb-6 text-gray-400">Time to start shopping!</p>
                        <a href="/shop" className="text-primary font-bold uppercase tracking-widest border-b-2 border-primary pb-1">Browse Collection</a>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex gap-8 text-sm">
                                        <div>
                                            <p className="text-gray-500 uppercase tracking-wider text-xs font-bold">Order Placed</p>
                                            <p className="font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 uppercase tracking-wider text-xs font-bold">Total</p>
                                            <p className="font-medium">₹{order.total_amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 uppercase tracking-wider text-xs font-bold">Order #</p>
                                            <p className="font-mono text-gray-600">{order.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-6 mb-6 last:mb-0">
                                            <div className="w-20 h-24 bg-gray-100 flex-shrink-0 border">
                                                <img
                                                    src={process.env.REACT_APP_BACKEND_URL + item.product_image}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>{item.product_name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Size: {item.selected_size} | Color: {item.selected_color} | Qty: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₹{item.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
