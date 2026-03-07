import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      subtitle: "Handcrafted Elegance",
      cta: "Explore Collection",
      link: "/shop",
      image: "/images/Carousel/Carousel img1.jpeg"
    },
    {
      subtitle: "Timeless Traditions",
      cta: "Shop New Arrivals",
      link: "/shop",
      image: "/images/Carousel/Carousel img2.jpeg"
    },
    {
      subtitle: "Modern Ethnic",
      cta: "View Best Sellers",
      link: "/shop",
      image: "/images/Carousel/Carousel img3.jpeg"
    }
  ];

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const productsRes = await api.get('/products/trending');
      setTrendingProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Carousel */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div className="relative w-full h-full">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear transform scale-105"
                style={{
                  backgroundImage: `url('${slide.image}')`,
                  transform: index === currentSlide ? 'scale(1.0)' : 'scale(1.1)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
              <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-4">
                <p className="text-sm md:text-base mb-4 font-medium tracking-[0.3em] uppercase text-white/90">VS Fashion</p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl mb-8 tracking-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {slide.subtitle}
                </h1>
                <Link
                  to={slide.link}
                  className="relative z-20 bg-white text-[#8B1B4A] px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#8B1B4A] hover:text-white transition-all duration-300 shadow-lg"
                  data-testid="hero-cta"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 text-white transition-all rounded-full border border-white/30"
          data-testid="hero-prev"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 text-white transition-all rounded-full border border-white/30"
          data-testid="hero-next"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50 w-2 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      </section>

      {/* Trending Section with Background */}
      {!loading && trendingProducts.length > 0 && (
        <section className="relative py-16 md:py-24" data-testid="trending-section">
          {/* Background with pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B1B4A] to-[#6B1539]">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1761516659902-2994696b362e?w=1200)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Trending Title */}
            <div className="text-center mb-12">
              <span className="text-white/70 text-xs font-bold tracking-[0.3em] uppercase block mb-2">What's Hot</span>
              <h2 className="text-4xl md:text-5xl font-normal text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Trending
              </h2>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {trendingProducts.slice(0, 8).map((product, idx) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className={`product-card group block bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow fade-in fade-in-delay-${Math.min(idx % 4 + 1, 4)}`}
                  data-testid={`trending-product-${idx}`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {product.quantity < 10 && product.quantity > 0 && (
                      <div className="absolute top-2 left-2 bg-[#8B1B4A] text-white text-[10px] px-2 py-1 font-semibold uppercase tracking-wide z-10 rounded">
                        Only {product.quantity} Left
                      </div>
                    )}
                    {product.quantity === 0 && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="text-[#8B1B4A] border-2 border-[#8B1B4A] px-4 py-2 text-sm font-bold uppercase tracking-widest">Sold Out</span>
                      </div>
                    )}
                    <img
                      src={process.env.REACT_APP_BACKEND_URL + product.images[0]}
                      alt={product.name}
                      className="product-card-image product-card-image-1 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.images[1] && (
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

            {/* View All Button */}
            <div className="mt-10 text-center">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-white text-[#8B1B4A] px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#8B1B4A] hover:text-white transition-all"
                data-testid="view-all-products"
              >
                View All Products <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* No Products Fallback */}
      {!loading && trendingProducts.length === 0 && (
        <section className="py-16 text-center">
          <p className="text-gray-500">No trending products available</p>
        </section>
      )}

      <Footer />
    </div>
  );
}
