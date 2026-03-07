import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken, hasAccount } from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Ruler } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '../components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [carouselApi, setCarouselApi] = useState(null);

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync carousel API with thumbnail selection
  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on('select', () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselApi]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
      if (response.data.variants.colors.length > 0) {
        setSelectedColor(response.data.variants.colors[0]);
      }
      if (response.data.variants.sizes.length > 0) {
        setSelectedSize(response.data.variants.sizes[0]);
      }
    } catch (error) {
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const scrollToImage = useCallback((index) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
      setCurrentImageIndex(index);
    }
  }, [carouselApi]);

  const handleAddToCart = async () => {
    if (!getToken()) {
      toast.error('Please sign in to add items to cart');
      navigate(hasAccount() ? '/login' : '/register');
      return;
    }

    if (!selectedColor || !selectedSize) {
      toast.error('Please select color and size');
      return;
    }

    if (quantity > product.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    setAdding(true);
    try {
      await api.post('/cart/add', {
        product_id: product.id,
        selected_color: selectedColor,
        selected_size: selectedSize,
        quantity
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!getToken()) {
      toast.error('Please sign in to buy now');
      navigate(hasAccount() ? '/login' : '/register');
      return;
    }

    if (!selectedColor || !selectedSize) {
      toast.error('Please select color and size');
      return;
    }

    if (quantity > product.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    try {
      await api.post('/cart/add', {
        product_id: product.id,
        selected_color: selectedColor,
        selected_size: selectedSize,
        quantity
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      navigate('/cart');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process buy now');
    }
  };

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

  if (!product) return null;

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image Carousel */}
            <div className="relative bg-muted rounded-sm overflow-hidden shadow-sm">
              <Carousel
                setApi={setCarouselApi}
                className="w-full"
                opts={{
                  loop: product.images.length > 1,
                  align: 'start',
                }}
              >
                <CarouselContent className="-ml-0">
                  {product.images.map((img, idx) => (
                    <CarouselItem key={idx} className="pl-0">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={process.env.REACT_APP_BACKEND_URL + img}
                          alt={`${product.name} - Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`product-image-${idx}`}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => scrollToImage((currentImageIndex - 1 + product.images.length) % product.images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-3 hover:bg-background transition-colors shadow-sm rounded-full text-primary"
                    data-testid="prev-image-btn"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => scrollToImage((currentImageIndex + 1) % product.images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-3 hover:bg-background transition-colors shadow-sm rounded-full text-primary"
                    data-testid="next-image-btn"
                  >
                    <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs px-4 py-1.5 rounded-full tracking-wider">
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToImage(idx)}
                    className={`flex-shrink-0 w-20 h-24 border-2 transition-all duration-300 rounded-sm overflow-hidden ${currentImageIndex === idx
                      ? 'border-primary shadow-md opacity-100'
                      : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img
                      src={process.env.REACT_APP_BACKEND_URL + img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="border-b border-border pb-8">
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-accent mb-3" data-testid="product-category">
                {product.category}
              </p>
              <h1 className="text-4xl md:text-5xl font-normal tracking-tight mb-4 text-primary" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="product-name">
                {product.name}
              </h1>
              <p className="text-3xl font-medium text-foreground/90" data-testid="product-price">₹{product.price.toLocaleString('en-IN')}</p>
            </div>

            {/* Stock Status */}
            {product.quantity === 0 ? (
              <div className="inline-block bg-muted text-muted-foreground text-xs font-bold px-4 py-2 uppercase tracking-widest border border-border">
                Out of Stock
              </div>
            ) : product.quantity < 10 ? (
              <div className="inline-block bg-red-50 text-red-700 text-xs font-bold px-4 py-2 uppercase tracking-widest border border-red-100">
                Only {product.quantity} left in stock
              </div>
            ) : (
              <div className="inline-block bg-green-50 text-green-800 text-xs font-bold px-4 py-2 uppercase tracking-widest border border-green-100">
                In Stock
              </div>
            )}

            <div className="space-y-8">
              {/* Color Selection */}
              <div>
                <label className="text-xs uppercase tracking-widest font-bold mb-4 block text-muted-foreground">
                  Color: <span className="text-primary">{selectedColor}</span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-6 py-3 text-sm transition-all duration-200 rounded-sm ${selectedColor === color
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-background border border-border hover:border-primary text-foreground'
                        }`}
                      data-testid={`color-${color}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                    Size: <span className="text-primary">{selectedSize}</span>
                  </label>
                  {product.variants.size_chart && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-2 text-xs uppercase tracking-wider hover:text-accent transition-colors" data-testid="size-chart-btn">
                          <Ruler className="w-4 h-4" />
                          Size Guide
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border">
                        <DialogHeader>
                          <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-primary">Size Guide</DialogTitle>
                        </DialogHeader>
                        <div className="py-6">
                          <p className="text-sm text-muted-foreground leading-relaxed">{product.variants.size_chart}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[56px] px-4 py-3 text-sm transition-all duration-200 rounded-sm ${selectedSize === size
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-background border border-border hover:border-primary text-foreground'
                        }`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs uppercase tracking-widest font-bold mb-4 block text-muted-foreground">Quantity</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center border border-border bg-background rounded-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-muted transition-colors text-primary"
                      disabled={quantity <= 1}
                      data-testid="decrease-qty-btn"
                    >
                      <Minus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <span className="text-base font-medium w-12 text-center text-primary" data-testid="quantity-display">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className="p-3 hover:bg-muted transition-colors text-primary"
                      disabled={quantity >= product.quantity}
                      data-testid="increase-qty-btn"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.quantity === 0}
                className="flex-1 uppercase tracking-[0.2em] text-sm font-bold px-8 py-5 bg-white text-primary hover:bg-muted border border-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md rounded-sm"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag className="w-5 h-5" />
                {adding ? 'Adding...' : product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.quantity === 0}
                className="flex-1 uppercase tracking-[0.2em] text-sm font-bold px-8 py-5 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] border border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg rounded-sm"
                data-testid="buy-now-btn"
              >
                Buy Now
              </button>
            </div>

            {/* Product Features */}
            <div className="pt-8 border-t border-border space-y-4">
              <div className="flex items-center gap-4 text-sm text-foreground/70">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span>Shipping within 2-3 days</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-foreground/70">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span>7 days easy return policy</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-foreground/70">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span>100% authentic handcrafted products</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
