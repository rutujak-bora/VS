import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const [activeTab, setActiveTab] = useState(null);

  const faqItems = [
    {
      question: "Where can I check my order details?",
      answer: "To view your order, simply text on WhatsApp at the number given on About Us (8421968737)"
    },
    {
      question: "Can I change my address after placing the order?",
      answer: "Yes, you can change the delivery address as long as your order has not been shipped. Once shipped, the address cannot be modified. For international address changes, extra shipping charges apply. If changed from international to India, shipping fees will be refunded as store credit. For further assistance, contact support@vsfashion.com"
    },
    {
      question: "The print has irregularities. Why?",
      answer: "Our products are handcrafted in small batches by artisans, so slight variations are natural and make each piece unique."
    },
    {
      question: "The colour of the product is slightly different. Why?",
      answer: "Photos are taken in different lighting conditions. Slight colour differences are unavoidable due to handmade processes and photography limitations."
    },
    {
      question: "Where are my tracking details?",
      answer: "Once the order is shipped, tracking details will be shared via call, email, or SMS."
    },
    {
      question: "Do you offer reverse pickup for returns?",
      answer: "Currently, reverse pickup is not available. Customers must ship returns themselves. Shipping charges are borne by the customer unless there is a genuine defect."
    }
  ];

  const termsItems = [
    "All products are handcrafted / hand block printed, so slight variations are natural.",
    "Colors may vary due to lighting or screen settings.",
    "No return or exchange on discounted or sale items.",
    "Exchange allowed within 3 days if unused and with original tag and bill.",
    "No cash refund. Store credit or exchange only.",
    "Custom-made or altered products cannot be returned or exchanged.",
    "Order cancellation is not allowed once confirmed.",
    "Minor irregularities are not considered defects.",
    "For dark colors, first wash separately in cold water.",
    "VS is not responsible for damage due to improper washing.",
    "By purchasing from VS, you agree to all terms & conditions."
  ];

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <footer className="border-t border-gray-200 mt-16 bg-gray-50">
      {/* Tab Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Link
            to="/about"
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-[#8B1B4A] border border-gray-300 rounded-full hover:border-[#8B1B4A] transition-all"
            data-testid="footer-about-link"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-[#8B1B4A] border border-gray-300 rounded-full hover:border-[#8B1B4A] transition-all"
            data-testid="footer-contact-link"
          >
            Contact Us
          </Link>
          <button
            onClick={() => toggleTab('faq')}
            className={`px-6 py-2 text-sm font-medium border rounded-full transition-all ${activeTab === 'faq'
                ? 'text-white bg-[#8B1B4A] border-[#8B1B4A]'
                : 'text-gray-700 border-gray-300 hover:text-[#8B1B4A] hover:border-[#8B1B4A]'
              }`}
            data-testid="footer-faq-btn"
          >
            FAQ's
          </button>
          <button
            onClick={() => toggleTab('terms')}
            className={`px-6 py-2 text-sm font-medium border rounded-full transition-all ${activeTab === 'terms'
                ? 'text-white bg-[#8B1B4A] border-[#8B1B4A]'
                : 'text-gray-700 border-gray-300 hover:text-[#8B1B4A] hover:border-[#8B1B4A]'
              }`}
            data-testid="footer-terms-btn"
          >
            Terms & Conditions
          </button>
        </div>

        {/* FAQ Content */}
        {activeTab === 'faq' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 fade-in" data-testid="faq-content">
            <h3 className="text-xl font-semibold text-[#8B1B4A] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <FAQItem key={index} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        )}

        {/* Terms Content */}
        {activeTab === 'terms' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 fade-in" data-testid="terms-content">
            <h3 className="text-xl font-semibold text-[#8B1B4A] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Terms & Conditions
            </h3>
            <ul className="space-y-2">
              {termsItems.map((item, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-[#8B1B4A] mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-[#8B1B4A] text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-medium mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>VS Fashion</h3>
              <p className="text-sm leading-relaxed text-white/80">
                VS Fashion offers handcrafted, original designs made with care and purpose. Each piece tells a story of tradition and elegance.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-white/90">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop" className="text-white/80 hover:text-white transition-colors">Shop</Link></li>
                <li><Link to="/about" className="text-white/80 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-white/80 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-white/90">Contact Info</h4>
              <div className="space-y-3">
                <p className="text-sm text-white/80 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> +91 84219 68737
                </p>
                <p className="text-sm text-white/80 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> vsfashiiiion@gmail.com
                </p>
                <p className="text-xs text-white/60 mt-4">Owner: Vaibhavi Choudhary</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>© {new Date().getFullYear()} VS Fashion. All rights reserved.</p>
            <Link to="/admin/login" className="hover:text-white transition-colors text-[10px] uppercase tracking-[0.2em] opacity-50 hover:opacity-100">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium text-gray-800">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#8B1B4A]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 text-sm text-gray-600 bg-white border-t border-gray-100">
          {answer}
        </div>
      )}
    </div>
  );
}
