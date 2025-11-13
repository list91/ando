import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, LayoutDashboard, LogOut, Settings, Image as ImageIcon, FileText, Folder, ImagePlay, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === path;
  };

  const navSections = [
    {
      title: null,
      items: [
        { path: '/admin', label: 'Главная', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Управление заказами',
      items: [
        { path: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
      ]
    },
    {
      title: 'Управление контентом',
      items: [
        { path: '/admin/products', label: 'Товары', icon: Package },
        { path: '/admin/categories', label: 'Категории', icon: Folder },
        { path: '/admin/hero-image', label: 'Главное фото', icon: ImageIcon },
        { path: '/admin/lookbook', label: 'Лукбук', icon: ImageIcon },
        { path: '/admin/about-page', label: 'О бренде', icon: Info },
        { path: '/admin/info-pages', label: 'Инфо страницы', icon: FileText },
        { path: '/admin/site-settings', label: 'Настройки сайта', icon: Settings },
      ]
    }
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

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && (
                  <h3 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                          isActive(item.path)
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;