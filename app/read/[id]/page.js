'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

export default function ReaderPage() {
  const { id } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/links/${id}`);
        if (!res.ok) throw new Error('Failed to fetch link');
        const data = await res.json();
        setLink(data);
      } catch (err) {
        console.error('Error fetching link:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchLink();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading Reader...</span>
      </div>
    );
  }

  if (!link) {
    return <p className="text-center mt-5">Link not found.</p>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <ButtonGroup>
          <Button href="/dashboard" variant="outline-secondary" size="sm">
            ← Back to Dashboard
          </Button>
          <Button
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline-primary"
            size="sm"
          >
            View Original Article
          </Button>
        </ButtonGroup>
      </div>
      <h2 className="mb-3">{link.linkTitle || 'Untitled'}</h2>

      {link.archivedContent ? (
        <div
          className="reader-content"
          dangerouslySetInnerHTML={{ __html: link.archivedContent }}
        />
      ) : (
        <div className="alert alert-info">
          No archived version available.{' '}
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            View live article instead
          </a>
        </div>
      )}
    </div>
  );
}
