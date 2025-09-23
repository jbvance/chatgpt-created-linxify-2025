'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import parse from 'html-react-parser';
import toast from 'react-hot-toast';

export default function ReaderPage() {
  const { id } = useParams();
  const router = useRouter();

  const [link, setLink] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // highlight UI state
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [note, setNote] = useState('');
  const [buttonPos, setButtonPos] = useState(null);
  const containerRef = useRef();

  // Fetch link + highlights
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [linkRes, highlightsRes] = await Promise.all([
          fetch(`/api/links/${id}`),
          fetch(`/api/highlights?linkId=${id}`),
        ]);

        if (!linkRes.ok) throw new Error('Link not found');
        const linkData = await linkRes.json();
        const highlightsData = highlightsRes.ok
          ? await highlightsRes.json()
          : [];

        setLink(linkData);
        setHighlights(highlightsData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  // Selection handler
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setButtonPos(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setSelectedText(text);
      setButtonPos({
        top: rect.top + window.scrollY - 30,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const saveHighlight = async () => {
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, text: selectedText, note }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save highlight');
      }

      const newHighlight = await res.json();
      setHighlights((prev) => [newHighlight, ...prev]);
      toast.success('Highlight saved');
    } catch (err) {
      console.error(err);
      toast.error('Error saving highlight');
    } finally {
      setShowModal(false);
      setSelectedText('');
      setNote('');
      setButtonPos(null);
    }
  };

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

      {/* Reader Content */}
      <div
        ref={containerRef}
        className="reader-content"
        onMouseUp={handleMouseUp}
      >
        {link.archivedContent ? (
          parse(link.archivedContent)
        ) : (
          <div>
            <p className="text-muted">
              No archived copy available. Loading live site:
            </p>
            <iframe
              src={link.url}
              title="Live site"
              style={{
                width: '100%',
                height: '80vh',
                border: '1px solid #ddd',
              }}
            />
          </div>
        )}
      </div>

      {/* Floating highlight button */}
      {buttonPos && (
        <Button
          size="sm"
          style={{
            position: 'absolute',
            top: buttonPos.top,
            left: buttonPos.left,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={() => setShowModal(true)}
        >
          Highlight
        </Button>
      )}

      {/* Modal to add note */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Highlight</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <em>{selectedText}</em>
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Note (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveHighlight}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
