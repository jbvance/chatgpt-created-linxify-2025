'use client';

import { useEffect } from 'react';

export default function Providers({ children }) {
  // Load Bootstrap's JS bundle (tooltips/modals, etc.)
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return children;
}
