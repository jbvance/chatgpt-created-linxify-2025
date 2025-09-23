// app/dashboard/page.js
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Placeholder, Spinner, Alert } from 'react-bootstrap';
import LinkFormModal from '@/components/LinkFormModal';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching links:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    await fetch(`/api/links/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    fetchLinks();
  };

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">My Links</h1>
        <Button onClick={() => setShowModal(true)}>Add Link</Button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="row g-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="col-md-4" key={i}>
              <Card>
                <Card.Body>
                  <Placeholder as={Card.Title} animation="wave">
                    <Placeholder xs={6} />
                  </Placeholder>
                  <Placeholder as={Card.Text} animation="wave">
                    <Placeholder xs={7} /> <Placeholder xs={4} />{' '}
                    <Placeholder xs={4} /> <Placeholder xs={6} />{' '}
                    <Placeholder xs={8} />
                  </Placeholder>
                  <div className="mt-3 d-flex justify-content-between">
                    <Placeholder.Button variant="primary" xs={4} />
                    <Placeholder.Button variant="danger" xs={4} />
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <Alert variant="info" className="text-center">
          You don’t have any saved links yet. Click <strong>Add Link</strong> to
          get started!
        </Alert>
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
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small"
                  >
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
                      disabled={deletingId === link.id}
                    >
                      {deletingId === link.id ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        'Delete'
                      )}
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
