import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Menu, X, ChevronRight, ChevronDown } from 'lucide-react';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState({});
  const [products, setProducts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCollection, setExpandedCollection] = useState(null);

  // Selection
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    searchParams.get('collection_id') || searchParams.get('collection') || ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    searchParams.get('category_id') || searchParams.get('category') || ''
  );

  const [loading, setLoading] = useState(true);

  // 1. Fetch Collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await api.get('/collections');
        setCollections(res.data);

        // Fetch all categories for each collection
        const categoriesMap = {};
        for (const collection of res.data) {
          const categoriesRes = await api.get(`/categories?collection_id=${collection.id}`);
          categoriesMap[collection.id] = categoriesRes.data;
        }
        setAllCategories(categoriesMap);

        // If collection is already selected from URL, expand it
        if (selectedCollectionId) {
          setExpandedCollection(selectedCollectionId);
        }
      } catch (e) {
        console.error("Failed to fetch collections");
      }
    };
    fetchCollections();
  }, []);

  // 2. Fetch Products when Collection or Category changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = '/products';
        const params = [];
        
        if (selectedCollectionId) {
          params.push(`collection_id=${selectedCollectionId}`);
        }
        if (selectedCategoryId) {
          params.push(`category_id=${selectedCategoryId}`);
        }
        
        if (params.length > 0) {
          url += '?' + params.join('&');
        }
        
        const res = await api.get(url);
        setProducts(res.data);
      } catch (e) {
        console.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    // Update URL
    const params = {};
    if (selectedCollectionId) params.collection_id = selectedCollectionId;
    if (selectedCategoryId) params.category_id = selectedCategoryId;
    setSearchParams(params);

  }, [selectedCollectionId, selectedCategoryId]);

  const handleCollectionSelect = (collectionId) => {
    if (expandedCollection === collectionId) {
      // If clicking same collection, just select it
      setSelectedCollectionId(collectionId);
      setSelectedCategoryId('');
      setSidebarOpen(false);
    } else {
      // Expand to show categories
      setExpandedCollection(collectionId);
    }
  };

  const handleCategorySelect = (collectionId, categoryId) => {
    setSelectedCollectionId(collectionId);
    setSelectedCategoryId(categoryId);
    setSidebarOpen(false);
  };

  const handleViewAllInCollection = (collectionId) => {
    setSelectedCollectionId(collectionId);
    setSelectedCategoryId('');
    setSidebarOpen(false);
  };

  const clearFilters = () => {
    setSelectedCollectionId('');
    setSelectedCategoryId('');
    setExpandedCollection(null);
    setSidebarOpen(false);
  };

  const getSelectedLabel = () => {
    if (selectedCategoryId) {
      for (const coll of collections) {
        const cat = allCategories[coll.id]?.find(c => c.id === selectedCategoryId);
        if (cat) return cat.name;
      }
    }
    if (selectedCollectionId) {
      const coll = collections.find(c => c.id === selectedCollectionId);
      return coll ? coll.name : 'All Products';
    }
    return 'All Products';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Bar with Hamburger Menu */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 text-gray-700 hover:text-[#8B1B4A] transition-colors"
              data-testid="filter-menu-btn"
            >
              <Menu className="w-6 h-6" />
              <span className="text-sm font-medium hidden sm:inline">Filters</span>
            </button>
            
            {/* Current Selection */}
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-800">{getSelectedLabel()}</span>
              {(selectedCollectionId || selectedCategoryId) && (
                <button 
                  onClick={clearFilters}
                  className="ml-3 text-xs text-[#8B1B4A] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        <div className="flex relative">
          {/* Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div 
            className={`fixed lg:relative top-0 left-0 h-full lg:h-auto w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
            }`}
            data-testid="filter-sidebar"
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Shop By
                </h3>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* All Products */}
              <button
                onClick={clearFilters}
                className={`w-full text-left px-3 py-2 mb-2 rounded transition-colors ${
                  !selectedCollectionId && !selectedCategoryId 
                    ? 'bg-[#8B1B4A] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                data-testid="filter-all-products"
              >
                All Products
              </button>

              {/* Collections */}
              <div className="space-y-1">
                {collections.map((collection) => (
                  <div key={collection.id}>
                    <button
                      onClick={() => handleCollectionSelect(collection.id)}
                      className={`w-full text-left px-3 py-2 rounded flex items-center justify-between transition-colors ${
                        selectedCollectionId === collection.id && !selectedCategoryId
                          ? 'bg-[#8B1B4A] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      data-testid={`filter-collection-${collection.id}`}
                    >
                      <span className="font-medium">{collection.name}</span>
                      {allCategories[collection.id]?.length > 0 && (
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${
                            expandedCollection === collection.id ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Categories under Collection */}
                    {expandedCollection === collection.id && allCategories[collection.id]?.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                        <button
                          onClick={() => handleViewAllInCollection(collection.id)}
                          className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                            selectedCollectionId === collection.id && !selectedCategoryId
                              ? 'text-[#8B1B4A] font-semibold'
                              : 'text-gray-600 hover:text-[#8B1B4A]'
                          }`}
                        >
                          All {collection.name}
                        </button>
                        {allCategories[collection.id].map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(collection.id, category.id)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                              selectedCategoryId === category.id
                                ? 'text-[#8B1B4A] font-semibold bg-pink-50'
                                : 'text-gray-600 hover:text-[#8B1B4A] hover:bg-gray-50'
                            }`}
                            data-testid={`filter-category-${category.id}`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-24">
                <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-[#8B1B4A] rounded-full animate-spin"></div>
                <p className="mt-4 text-sm tracking-widest uppercase text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-lg text-gray-500" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  No products found
                </p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 text-sm text-[#8B1B4A] hover:underline"
                >
                  View all products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, idx) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="product-card group block bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow fade-in"
                    style={{ animationDelay: `${(idx % 8) * 0.05}s` }}
                    data-testid={`product-${product.id}`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {product.quantity < 10 && product.quantity > 0 && (
                        <div className="absolute top-2 left-2 bg-[#8B1B4A] text-white text-[10px] px-2 py-1 font-semibold uppercase tracking-wide z-10 rounded">
                          Only {product.quantity} Left
                        </div>
                      )}
                      {product.quantity === 0 && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="text-[#8B1B4A] border-2 border-[#8B1B4A] px-3 py-1.5 text-xs font-bold uppercase tracking-widest">Sold Out</span>
                        </div>
                      )}
                      {product.is_trending && product.quantity > 0 && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider z-10 rounded">
                          Trending
                        </div>
                      )}
                      {product.images?.[0] && (
                        <img
                          src={process.env.REACT_APP_BACKEND_URL + product.images[0]}
                          alt={product.name}
                          className="product-card-image product-card-image-1 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      {product.images?.[1] && (
                        <img
                          src={process.env.REACT_APP_BACKEND_URL + product.images[1]}
                          alt={product.name}
                          className="product-card-image product-card-image-2 w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="p-3 text-center">
                      <h3 className="text-sm font-medium line-clamp-1 text-gray-800 group-hover:text-[#8B1B4A] transition-colors" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                        {product.name}
                      </h3>
                      <p className="text-sm font-semibold text-[#8B1B4A] mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* End of results */}
            {!loading && products.length > 0 && (
              <div className="mt-16 text-center">
                <div className="w-16 h-px bg-gray-300 mx-auto mb-4"></div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">End of collection</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
