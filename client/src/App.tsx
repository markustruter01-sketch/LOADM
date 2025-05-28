// ISOLATED APP - AUTHENTICATION TEST ONLY
import { IsolatedAuthProvider } from './auth-isolated/auth-context';
import { IsolatedTestPage } from './auth-isolated/test-page';

function App() {
  return (
    <IsolatedAuthProvider>
      <IsolatedTestPage />
    </IsolatedAuthProvider>
  );
}

export default App;