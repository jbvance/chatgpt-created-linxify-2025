'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner, Alert } from 'react-bootstrap';
import parse from 'html-react-parser';

export default function ReaderPage() {
  const { id } = useParams();
  const router = useRouter();

  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLink() {
      try {
        setLoading(true);
        const res = await fetch(`/api/links/${id}`);
        if (!res.ok) throw new Error('Link not found');
        const data = await res.json();
        setLink(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchLink();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" /> <span className="ms-2">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <Alert variant="danger">Error: {error}</Alert>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!link) return null;

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{link.linkTitle || 'Untitled'}</h2>
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="primary"
            size="sm"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Original
          </Button>
        </div>
      </div>

      {/* Render archived content if available */}
      {link.archivedContent ? (
        <div className="reader-content">{parse(link.archivedContent)}</div>
      ) : (
        <div>
          <p className="text-muted">
            No archived copy available. Loading live site:
          </p>
          <iframe
            src={link.url}
            title="Live site"
            style={{ width: '100%', height: '80vh', border: '1px solid #ddd' }}
          />
        </div>
      )}
    </div>
  );
}
