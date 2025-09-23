// app/layout.js
import './globals.scss';
import Providers from './providers';

export const metadata = {
  title: 'Linxify',
  description: 'Save, organize, read, highlight, and tag your favorite links.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
