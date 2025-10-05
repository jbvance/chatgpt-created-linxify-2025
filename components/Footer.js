// components/Footer.js
export default function Footer() {
  return (
    <footer className="bg-light border-top py-3 mt-auto">
      <div className="container text-center text-muted small">
        &copy; {new Date().getFullYear()} Linxify —-- All rights reserved.
      </div>
    </footer>
  );
}
