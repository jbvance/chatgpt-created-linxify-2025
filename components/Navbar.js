// components/Navbar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Container, Nav, Navbar as BsNavbar, Button } from 'react-bootstrap';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <BsNavbar bg="light" expand="lg" className="border-bottom">
      <Container>
        <Link href="/" className="navbar-brand fw-bold">
          Linxify
        </Link>

        <BsNavbar.Toggle aria-controls="main-navbar" />
        <BsNavbar.Collapse id="main-navbar">
          <Nav className="ms-auto">
            {session ? (
              <>
                <Nav.Item className="me-3 d-flex align-items-center">
                  <span className="text-muted small">
                    {session.user?.email}
                  </span>
                </Nav.Item>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`nav-link ${pathname === '/auth/login' ? 'active' : ''}`}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className={`nav-link ${pathname === '/auth/register' ? 'active' : ''}`}
                >
                  Register
                </Link>
              </>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
