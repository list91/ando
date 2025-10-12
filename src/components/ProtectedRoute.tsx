import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!requiredRole) {
        setHasRole(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'manager']);

      if (data && data.length > 0) {
        const userRoles = data.map((r) => r.role);
        if (requiredRole === 'admin') {
          setHasRole(userRoles.includes('admin'));
        } else if (requiredRole === 'manager') {
          setHasRole(
            userRoles.includes('admin') || userRoles.includes('manager')
          );
        }
      } else {
        setHasRole(false);
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkRole();
    }
  }, [user, requiredRole, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && hasRole === false) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Доступ запрещен</h1>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра этой страницы
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;