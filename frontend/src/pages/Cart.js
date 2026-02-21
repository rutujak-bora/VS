import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getToken, getCustomer } from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setCart(response.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (index) => {
    try {
      await api.delete(`/cart/${index}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Item removed from cart');
      fetchCart();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const placeOrder = async () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setPlacing(true);
    try {
      const response = await api.post('/orders', {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/home" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-primary font-medium">Cart</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-normal tracking-tight mb-8 text-primary" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="cart-title">
          Shopping Cart
        </h1>

        {cart.items.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border bg-background/50 rounded-sm" data-testid="empty-cart">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" strokeWidth={1} />
            <h2 className="text-xl font-medium mb-2 text-primary">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 uppercase tracking-widest text-xs font-bold px-8 py-4 bg-primary text-primary-foreground hover:bg-background hover:text-primary border-2 border-primary transition-all duration-300 rounded-sm"
              data-testid="continue-shopping-btn"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="border-b-2 border-primary/20 pb-4 mb-6 hidden md:grid grid-cols-12 gap-4 text-xs uppercase tracking-widest font-bold text-muted-foreground">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="space-y-6">
                {cart.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid md:grid-cols-12 gap-4 pb-6 border-b border-border items-center"
                    data-testid={`cart-item-${index}`}
                  >
                    {/* Product Info */}
                    <div className="md:col-span-6 flex gap-4">
                      <Link to={`/product/${item.product_id}`} className="w-24 h-32 flex-shrink-0 overflow-hidden bg-muted rounded-sm shadow-sm">
                        <img
                          src={process.env.REACT_APP_BACKEND_URL + item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </Link>
                      <div className="flex flex-col justify-between py-1">
                        <div>
                          <Link to={`/product/${item.product_id}`}>
                            <h3 className="font-medium hover:text-primary transition-colors text-lg" style={{ fontFamily: 'Playfair Display, serif' }} data-testid={`item-name-${index}`}>
                              {item.product_name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.selected_color} / {item.selected_size}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-600 transition-colors w-fit group"
                          data-testid={`remove-item-${index}`}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2 md:text-center">
                      <span className="md:hidden text-sm text-muted-foreground mr-2">Price:</span>
                      <span className="font-medium text-foreground/80">₹{item.price.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 md:text-center">
                      <span className="md:hidden text-sm text-muted-foreground mr-2">Qty:</span>
                      <span className="inline-flex items-center justify-center w-10 h-10 border border-border bg-background rounded-sm text-sm font-medium">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="md:col-span-2 md:text-right">
                      <span className="md:hidden text-sm text-muted-foreground mr-2">Total:</span>
                      <span className="font-bold text-primary" data-testid={`item-total-${index}`}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Link */}
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 mt-8 text-sm hover:text-primary font-medium tracking-wide uppercase transition-colors group"
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-background p-6 lg:p-8 sticky top-24 border border-border shadow-sm rounded-sm">
                <h2 className="text-2xl font-normal mb-8 text-primary border-b border-border pb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Order Summary</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({totalQuantity} items)</span>
                    <span className="font-medium" data-testid="total-items">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-green-700">Free</span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold pt-4 border-t border-dashed border-border mb-8 text-primary">
                  <span>Total</span>
                  <span data-testid="total-price">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full uppercase tracking-widest text-xs font-bold px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-sm"
                  data-testid="place-order-btn"
                >
                  <Package className="w-4 h-4" />
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>

                <p className="text-xs text-muted-foreground text-center mt-6 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Secure Checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
