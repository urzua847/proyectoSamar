import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';

import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';

function Root() {
  return (
    <AuthProvider>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </AuthProvider>
  );
}

export default Root;