import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, Boxes, FolderTree, Tags } from 'lucide-react';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-transparent flex">
      <aside className="w-64 border-r border-border p-6 flex flex-col bg-white/50 backdrop-blur-sm">
        <Link to="/admin/dashboard" className="mb-12">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
            VS Fashion
          </h1>
          <p className="text-xs uppercase tracking-widest mt-1 text-muted-foreground">Admin Panel</p>
        </Link>

        <nav className="flex-1 space-y-2">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all rounded-sm ${isActive('/admin/dashboard') ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
              }`}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
            Dashboard
          </Link>
          <Link
            to="/admin/products"
            className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all rounded-sm ${isActive('/admin/products') ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
              }`}
            data-testid="nav-products"
          >
            <Package className="w-4 h-4" strokeWidth={2} />
            Products
          </Link>
          <Link
            to="/admin/collections"
            className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all rounded-sm ${isActive('/admin/collections') ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
              }`}
          >
            <FolderTree className="w-4 h-4" strokeWidth={2} />
            Collections
          </Link>
          <Link
            to="/admin/categories"
            className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all rounded-sm ${isActive('/admin/categories') ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
              }`}
          >
            <Tags className="w-4 h-4" strokeWidth={2} />
            Categories
          </Link>
          <Link
            to="/admin/inventory"
            className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all rounded-sm ${isActive('/admin/inventory') ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
              }`}
            data-testid="nav-inventory"
          >
            <Boxes className="w-4 h-4" strokeWidth={2} />
            Inventory
          </Link>
          <Link
            to="/admin/customers"
            className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all rounded-sm ${isActive('/admin/customers') ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
              }`}
            data-testid="nav-customers"
          >
            <Users className="w-4 h-4" strokeWidth={2} />
            Customers
          </Link>
          <Link
            to="/admin/orders"
            className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold transition-all rounded-sm ${isActive('/admin/orders') ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-foreground'
              }`}
            data-testid="nav-orders"
          >
            <ShoppingCart className="w-4 h-4" strokeWidth={2} />
            Orders
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest font-bold hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left rounded-sm"
          data-testid="admin-logout-btn"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Logout
        </button>
      </aside>

      <main className="flex-1 p-12 overflow-auto">
        {children}
      </main>
    </div>
  );
}