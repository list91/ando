import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
    { path: '/admin/products', label: 'Товары', icon: Package },
  ];

  return (
    <div className="flex h-screen bg-secondary/10">
      <aside className="w-64 border-r bg-background flex flex-col">
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            <span className="font-semibold">Админ-панель</span>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <Link to="/">
            <Button variant="outline" className="w-full mb-2">
              На сайт
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;