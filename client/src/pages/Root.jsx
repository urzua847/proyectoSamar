import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';

import Footer from '../components/Footer';

function Root() {
  return (
    <AuthProvider>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </AuthProvider>
  );
}

export default Root;