// ISOLATED LOGOUT COMPONENT - Works independently
import { useIsolatedAuth } from './auth-context';

export function IsolatedLogoutButton() {
  const { logout, user } = useIsolatedAuth();

  const handleLogout = () => {
    console.log('✅ ISOLATED COMPONENT: Logout button clicked');
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Logout
    </button>
  );
}

export function IsolatedUserDisplay() {
  const { user } = useIsolatedAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-700">
        Welcome, {user.email}
      </span>
      <IsolatedLogoutButton />
    </div>
  );
}