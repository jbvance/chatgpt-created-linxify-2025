// app/dashboard/page.js
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Placeholder,
  Spinner,
  Alert,
  Form,
  InputGroup,
} from 'react-bootstrap';
import LinkFormModal from '@/components/LinkFormModal';
import CreatableSelect from 'react-select/creatable';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

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

  // Collect all unique tags for filter dropdown
  const allTags = useMemo(() => {
    const tagSet = new Set();
    links.forEach((link) => {
      (link.tags || []).forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [links]);

  // Filtered, searched, and sorted links
  const filteredLinks = useMemo(() => {
    let result = [...links];

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((link) =>
        selectedTags.every((tag) => link.tags?.includes(tag))
      );
    }

    // Text search
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        (link) =>
          link.linkTitle?.toLowerCase().includes(q) ||
          link.linkDescription?.toLowerCase().includes(q) ||
          link.url?.toLowerCase().includes(q) ||
          link.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'az':
        result.sort((a, b) =>
          (a.linkTitle || '').localeCompare(b.linkTitle || '')
        );
        break;
      case 'za':
        result.sort((a, b) =>
          (b.linkTitle || '').localeCompare(a.linkTitle || '')
        );
        break;
      default: // newest
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [links, selectedTags, search, sort]);

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">My Links</h1>
        <Button onClick={() => setShowModal(true)}>Add Link</Button>
      </div>

      {/* Filters row */}
      <div className="row mb-4 g-3 align-items-end">
        <div className="col-md-4">
          {allTags.length > 0 && (
            <CreatableSelect
              isMulti
              placeholder="Filter by tags..."
              value={selectedTags.map((t) => ({ label: t, value: t }))}
              options={allTags.map((t) => ({ label: t, value: t }))}
              onChange={(selected) =>
                setSelectedTags(selected.map((s) => s.value))
              }
            />
          )}
        </div>
        <div className="col-md-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch('')}>
                Clear
              </Button>
            )}
          </InputGroup>
        </div>
        <div className="col-md-4">
          <Form.Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">Alphabetical (A–Z)</option>
            <option value="za">Alphabetical (Z–A)</option>
          </Form.Select>
        </div>
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
      ) : filteredLinks.length === 0 ? (
        <Alert variant="info" className="text-center">
          {selectedTags.length > 0 || search
            ? 'No links match your filters.'
            : 'You don’t have any saved links yet. Click Add Link to get started!'}
        </Alert>
      ) : (
        <div className="row g-3">
          {filteredLinks.map((link) => (
            <div className="col-md-4" key={link.id}>
              <Card>
                <Card.Body>
                  <Card.Title>{link.linkTitle}</Card.Title>
                  <Card.Text>
                    {link.linkDescription || 'No description'}
                  </Card.Text>
                  {link.tags?.length > 0 && (
                    <div className="mb-2">
                      {link.tags.map((tag) => (
                        <span key={tag} className="badge bg-secondary me-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
