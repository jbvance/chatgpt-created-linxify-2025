// app/dashboard/page.js
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Spinner } from 'react-bootstrap';
import LinkFormModal from '@/components/LinkFormModal';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLink, setEditLink] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLinks();
    }
  }, [status]);

  const fetchLinks = async () => {
    setLoading(true);
    const res = await fetch('/api/links');
    const data = await res.json();
    setLinks(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/links/${id}`, { method: 'DELETE' });
    fetchLinks();
  };

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">My Links</h1>
        <Button onClick={() => setShowModal(true)}>Add Link</Button>
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="row g-3">
          {links.map((link) => (
            <div className="col-md-4" key={link.id}>
              <Card>
                <Card.Body>
                  <Card.Title>{link.linkTitle}</Card.Title>
                  <Card.Text>
                    {link.linkDescription || 'No description'}
                  </Card.Text>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    Visit
                  </a>
                  <div className="mt-3 d-flex justify-content-between">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        setEditLink(link);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(link.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <LinkFormModal
          show={showModal}
          handleClose={() => {
            setShowModal(false);
            setEditLink(null);
          }}
          onSaved={fetchLinks}
          editLink={editLink}
        />
      )}
    </main>
  );
}
