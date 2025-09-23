'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  OverlayTrigger,
  Tooltip,
  Accordion,
  ListGroup,
} from 'react-bootstrap';
import parse, { domToReact } from 'html-react-parser';
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

  // edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHighlight, setEditHighlight] = useState(null);
  const [editNote, setEditNote] = useState('');

  const contentRef = useRef();

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
      const normalized = selectedText.replace(/\s+/g, ' ').trim();

      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, text: normalized, note }),
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

  // Helper: apply highlights to HTML node-by-node
  function applyHighlights(html, highlights) {
    if (!html || highlights.length === 0) return parse(html);

    return parse(html, {
      replace: (domNode) => {
        if (domNode.type === 'text') {
          let text = domNode.data;
          const normalizedText = text.replace(/\s+/g, ' ');

          const parts = [];
          let remaining = normalizedText;

          highlights.forEach((h) => {
            const target = h.text.replace(/\s+/g, ' ');
            const idx = remaining.indexOf(target);
            if (idx !== -1) {
              if (idx > 0) parts.push(remaining.slice(0, idx));

              parts.push(
                <OverlayTrigger
                  key={`${h.id}-${idx}`}
                  placement="top"
                  overlay={h.note ? <Tooltip>{h.note}</Tooltip> : <></>}
                >
                  <mark id={`highlight-${h.id}`} className="highlight-mark">
                    {target}
                  </mark>
                </OverlayTrigger>
              );

              remaining = remaining.slice(idx + target.length);
            }
          });

          if (parts.length > 0) {
            if (remaining) parts.push(remaining);
            return <>{parts}</>;
          }
        }
      },
    });
  }

  const scrollToHighlight = (hid) => {
    const el = document.getElementById(`highlight-${hid}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flash-highlight');
      setTimeout(() => el.classList.remove('flash-highlight'), 1500);
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
    <div className="container py-4" style={{ maxWidth: '1200px' }}>
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

      <div className="row">
        {/* Reader Content */}
        <div className="col-md-8" onMouseUp={handleMouseUp} ref={contentRef}>
          {link.archivedContent ? (
            applyHighlights(link.archivedContent, highlights)
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

        {/* Highlights Sidebar */}
        <div className="col-md-4">
          <Accordion defaultActiveKey={null}>
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                Highlights ({highlights.length})
              </Accordion.Header>
              <Accordion.Body>
                {highlights.length === 0 ? (
                  <p className="text-muted mb-0">No highlights yet.</p>
                ) : (
                  <ListGroup variant="flush">
                    {highlights.map((h) => {
                      const excerpt =
                        h.text.length > 100
                          ? `${h.text.slice(0, 100)}…`
                          : h.text;
                      return (
                        <ListGroup.Item
                          key={h.id}
                          className="d-flex justify-content-between align-items-start"
                        >
                          <div
                            className="me-2 flex-grow-1"
                            role="button"
                            onClick={() => scrollToHighlight(h.id)}
                          >
                            <div className="fw-semibold">“{excerpt}”</div>
                            {h.note && (
                              <small className="text-muted">{h.note}</small>
                            )}
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditHighlight(h);
                                setEditNote(h.note || '');
                                setShowEditModal(true);
                              }}
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch(
                                    `/api/highlights/${h.id}`,
                                    {
                                      method: 'DELETE',
                                    }
                                  );
                                  if (!res.ok) throw new Error('Delete failed');
                                  setHighlights((prev) =>
                                    prev.filter((hl) => hl.id !== h.id)
                                  );
                                  toast.success('Highlight deleted');
                                } catch (err) {
                                  console.error(err);
                                  toast.error('Error deleting highlight');
                                }
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </div>
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

      {/* Modal to add new highlight */}
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

      {/* Modal to edit existing highlight */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const res = await fetch(`/api/highlights/${editHighlight.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ note: editNote }),
                });
                if (!res.ok) throw new Error('Failed to update note');
                const updated = await res.json();
                setHighlights((prev) =>
                  prev.map((h) => (h.id === updated.id ? updated : h))
                );
                toast.success('Note updated');
                setShowEditModal(false);
              } catch (err) {
                console.error(err);
                toast.error('Error updating note');
              }
            }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
