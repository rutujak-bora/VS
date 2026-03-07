import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    collection_id: '',
    category_id: '',
    category: '', // legacy/display name
    colors: '',
    sizes: '',
    size_chart: '',
    quantity: '',
    price: '',
    is_trending: false
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    Promise.all([fetchProducts(), fetchMetadata()]);
  }, []);

  const fetchMetadata = async () => {
    try {
      const [colRes, catRes] = await Promise.all([
        api.get('/collections'),
        api.get('/categories')
      ]);
      setCollections(colRes.data);
      setAllCategories(catRes.data);
    } catch (e) {
      console.error("Failed to fetch metadata");
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentProduct(null);
    setFormData({
      name: '',
      collection_id: '',
      category_id: '',
      category: '',
      colors: '',
      sizes: '',
      size_chart: '',
      quantity: '',
      price: '',
      is_trending: false
    });
    setImages([]);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditMode(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      collection_id: product.collection_id || '',
      category_id: product.category_id || '',
      category: product.category,
      colors: product.variants.colors.join(','),
      sizes: product.variants.sizes.join(','),
      size_chart: product.variants.size_chart || '',
      quantity: product.quantity.toString(),
      price: product.price.toString(),
      is_trending: product.is_trending
    });
    setImages([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Find category name to populate legacy field
      const selectedCat = allCategories.find(c => c.id === formData.category_id);
      const categoryName = selectedCat ? selectedCat.name : formData.category;

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('collection_id', formData.collection_id);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('category', categoryName);
      formDataToSend.append('colors', formData.colors);
      formDataToSend.append('sizes', formData.sizes);
      if (formData.size_chart) {
        formDataToSend.append('size_chart', formData.size_chart);
      }
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('is_trending', formData.is_trending);

      if (images.length > 0) {
        images.forEach(img => formDataToSend.append('images', img));
      }

      if (editMode && currentProduct) {
        await api.put(`/admin/products/${currentProduct.id}`, formDataToSend);
        toast.success('Product updated successfully');
      } else {
        if (images.length === 0) {
          toast.error('Please upload at least one image');
          setSubmitting(false);
          return;
        }
        await api.post('/admin/products', formDataToSend);
        toast.success('Product created successfully');
      }

      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Filter categories for dropdown
  const filteredCategories = formData.collection_id
    ? allCategories.filter(c => c.collection_id === formData.collection_id)
    : [];

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold uppercase tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="products-title">
            Products
          </h1>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors text-xs uppercase tracking-widest font-bold"
            data-testid="add-product-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add Product
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border-2 border-black" data-testid="no-products">
            <p className="text-lg">No products found</p>
          </div>
        ) : (
          <div className="border-2 border-black">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Image</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Name</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Category</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Price</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Stock</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Trending</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product.id} className="border-b border-black">
                    <td className="p-4">
                      {product.images?.[0] && <img
                        src={process.env.REACT_APP_BACKEND_URL + product.images[0]}
                        alt={product.name}
                        className="w-16 h-20 object-cover border border-black"
                      />}
                    </td>
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">₹{product.price.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className={product.quantity < 10 ? 'text-red-600 font-bold' : ''}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="p-4">{product.is_trending ? 'Yes' : 'No'}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 hover:bg-gray-100 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowModal(false)}>
          <div className="bg-white border-2 border-black max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b-2 border-black flex items-center justify-between">
              <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>
                {editMode ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-b-2 border-black p-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Collection</label>
                  <select
                    value={formData.collection_id}
                    onChange={(e) => setFormData({ ...formData, collection_id: e.target.value, category_id: '' })}
                    className="w-full border-b-2 border-black p-2 bg-transparent"
                    required
                  >
                    <option value="">Select Collection</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full border-b-2 border-black p-2 bg-transparent"
                    required
                    disabled={!formData.collection_id}
                  >
                    <option value="">Select Category</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Colors (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    className="w-full border-b-2 border-black p-2"
                    placeholder="Red,Blue,Black"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Sizes (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    className="w-full border-b-2 border-black p-2"
                    placeholder="S,M,L,XL"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Size Chart (optional)</label>
                <input
                  type="text"
                  value={formData.size_chart}
                  onChange={(e) => setFormData({ ...formData, size_chart: e.target.value })}
                  className="w-full border-b-2 border-black p-2"
                  placeholder="Size guide info"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full border-b-2 border-black p-2"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest font-bold mb-2 block">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border-b-2 border-black p-2"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.is_trending}
                    onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-xs uppercase tracking-widest font-bold">Show in Trending</span>
                </label>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold mb-2 block">
                  Product Images {!editMode && '(up to 4, required)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImages(Array.from(e.target.files).slice(0, 4))}
                  className="w-full border-2 border-black p-2"
                />
                {images.length > 0 && (
                  <p className="text-sm mt-2">{images.length} image(s) selected</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors text-xs uppercase tracking-widest font-bold disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editMode ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}