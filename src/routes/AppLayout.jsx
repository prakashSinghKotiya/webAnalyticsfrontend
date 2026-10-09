import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useAuthState, useAuthActions } from '../context';
import { Navbar, MobileDrawer } from '../components';

export default function AppLayout() {
  const { user } = useAuthState();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileOpen(false);
  }

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin' || user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <Navbar
        user={user}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onMenuOpen={() => setMobileOpen(true)}
      />

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
