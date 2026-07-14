import { AuthGate } from './auth/AuthGate';
import App from './App';

export default function AppRoot() {
  return (
    <AuthGate>
      <App />
    </AuthGate>
  );
}
