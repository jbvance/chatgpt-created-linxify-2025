// app/layout.js
import './globals.scss';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
        </Providers>
      </body>
    </html>
  );
}
