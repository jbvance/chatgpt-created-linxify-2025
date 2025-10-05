// <mark>HIGHLIGHT</mark>: This is a new file for the main navigation header.
// app/components/AppNavbar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';

export default function AppNavbar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top">
      <Container>
        <Link href={session ? '/dashboard' : '/'} passHref legacyBehavior>
          <Navbar.Brand>Linxify</Navbar.Brand>
        </Link>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {isLoading ? (
              <Navbar.Text>Loading...</Navbar.Text>
            ) : session ? (
              // If user is logged in
              <>
                <Link href="/dashboard" passHref legacyBehavior>
                  <Nav.Link>Dashboard</Nav.Link>
                </Link>
                <Navbar.Text className="mx-2">
                  Signed in as {session.user?.email}
                </Navbar.Text>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              // If user is logged out
              <>
                <Link href="/signin" passHref legacyBehavior>
                  <Nav.Link>Sign In</Nav.Link>
                </Link>
                <Link href="/register" passHref legacyBehavior>
                  <Nav.Link
                    as={Button}
                    variant="primary"
                    size="sm"
                    className="ms-2"
                  >
                    Register
                  </Nav.Link>
                </Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
