// app/layout.js
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.scss';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Linxify',
  description: 'Save, organize, and read your favorite links.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="d-flex flex-column min-vh-100">
        <Providers>
          <Navbar />
          <main className="flex-grow-1">{children}</main>
          <Footer />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
