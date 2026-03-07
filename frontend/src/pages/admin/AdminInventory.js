import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';
import { Plus, Minus } from 'lucide-react';

export default function AdminInventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, change) => {
    try {
      await api.put(`/admin/inventory/${productId}`, null, {
        params: { quantity: change }
      });
      toast.success('Stock updated');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-4xl font-bold uppercase tracking-tight mb-8" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="inventory-title">
          Inventory Management
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border-2 border-black">
            <p className="text-lg">No products found</p>
          </div>
        ) : (
          <div className="border-2 border-black">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Product</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Category</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Current Stock</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product.id} className="border-b border-black" data-testid={`inventory-row-${idx}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={process.env.REACT_APP_BACKEND_URL + product.images[0]}
                          alt={product.name}
                          className="w-16 h-20 object-cover border border-black"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">
                      <span className={`text-lg font-bold ${product.quantity < 10 ? 'text-red-600' : product.quantity < 50 ? 'text-yellow-600' : ''
                        }`} data-testid={`stock-${idx}`}>
                        {product.quantity}
                      </span>
                      {product.quantity < 10 && (
                        <p className="text-xs text-red-600 mt-1">LOW STOCK ALERT</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStock(product.id, 10)}
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800 text-xs uppercase tracking-widest font-bold"
                          data-testid={`add-stock-${idx}`}
                        >
                          <Plus className="w-3 h-3" strokeWidth={2} />
                          Add 10
                        </button>
                        <button
                          onClick={() => updateStock(product.id, -10)}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-gray-100 text-xs uppercase tracking-widest font-bold"
                          disabled={product.quantity < 10}
                          data-testid={`remove-stock-${idx}`}
                        >
                          <Minus className="w-3 h-3" strokeWidth={2} />
                          Remove 10
                        </button>
                      </div>
                    </td>
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