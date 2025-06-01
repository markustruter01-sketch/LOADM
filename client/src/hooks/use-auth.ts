
import { useIsolatedAuth } from '../auth-isolated/auth-context';

export function useAuth() {
  return useIsolatedAuth();
}
