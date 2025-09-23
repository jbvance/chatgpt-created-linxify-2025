// app/dashboard/page.js
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Placeholder,
  Spinner,
  Form,
  InputGroup,
} from 'react-bootstrap';
import LinkFormModal from '@/components/LinkFormModal';
import CreatableSelect from 'react-select/creatable';
import toast from 'react-hot-toast';
import CategorySidebar from '@/components/CategorySidebar';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Link state
  const [links, setLinks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [quickSaveUrl, setQuickSaveUrl] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const observerRef = useRef();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      resetAndFetch();
    }
  }, [status]);

  // 🔹 Handle Quick-Save (`/add?url=...` → /dashboard?addUrl=...)
  useEffect(() => {
    const addUrl = searchParams.get('addUrl');
    if (addUrl) {
      setEditLink(null); // new link
      setQuickSaveUrl(addUrl);
      setShowModal(true);

      // Clean URL so refresh doesn't keep reopening modal
      const params = new URLSearchParams(window.location.search);
      params.delete('addUrl');
      const newUrl =
        window.location.pathname + (params.toString() ? `?${params}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const resetAndFetch = () => {
    setLinks([]);
    setPage(1);
    fetchLinks(1, true);
  };

  const fetchLinks = async (pageNum, reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(
        `/api/links?page=${pageNum}&pageSize=${pageSize}`
      );
      const data = await res.json();
      if (reset) {
        setLinks(
          Array.isArray(data.links)
            ? data.links.map((l) => ({ ...l, loaded: false }))
            : []
        );
      } else {
        setLinks((prev) => [
          ...prev,
          ...(Array.isArray(data.links)
            ? data.links.map((l) => ({ ...l, loaded: false }))
            : []),
        ]);
      }
      setTotal(data.total || 0);

      // 🔹 Mark cards as loaded after paint
      setTimeout(() => {
        setLinks((prev) => prev.map((l) => ({ ...l, loaded: true })));
      }, 50);
    } catch (err) {
      toast.error('Failed to load links');
      console.error('Error fetching links:', err);
    }

    if (pageNum === 1) setLoading(false);
    else setLoadingMore(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Link deleted');
        resetAndFetch();
      } else {
        toast.error('Failed to delete link');
      }
    } catch (err) {
      toast.error('Error deleting link');
      console.error(err);
    }
    setDeletingId(null);
  };

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    links.forEach((link) =>
      (link.tags || []).forEach((tag) => tagSet.add(tag))
    );
    return Array.from(tagSet).sort();
  }, [links]);

  // Filter, search, sort (client-side)
  const filteredLinks = useMemo(() => {
    let result = [...links];

    // Category filter
    if (selectedCategoryId !== null) {
      result = result.filter((link) =>
        link.categories?.some((c) => c.categoryId === selectedCategoryId)
      );
    }

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
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [links, selectedTags, search, sort, selectedCategoryId]);

  // Infinite scroll observer
  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && links.length < total) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchLinks(nextPage);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, page, total, links.length]
  );

  const hasMore = links.length < total;

  return (
    <main className="container-fluid py-5">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 mb-4">
          <CategorySidebar
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        {/* Main content */}
        <div className="col-md-9">
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
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSearch('')}
                  >
                    Clear
                  </Button>
                )}
              </InputGroup>
            </div>
            <div className="col-md-4">
              <Form.Select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
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
              {Array.from({ length: pageSize }).map((_, i) => (
                <div className="col-12 col-sm-6 col-lg-4" key={i}>
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
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <img
                src="/empty-links.svg"
                alt="No links yet"
                style={{ width: '150px', marginBottom: '1rem', opacity: 0.6 }}
              />
              <p>
                {selectedTags.length > 0 ||
                search ||
                selectedCategoryId !== null
                  ? 'No links match your filters.'
                  : 'You don’t have any saved links yet. Click Add Link to get started!'}
              </p>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {filteredLinks.map((link, idx) => {
                  const isLast = idx === filteredLinks.length - 1;
                  return (
                    <div
                      className="col-12 col-sm-6 col-lg-4"
                      key={link.id}
                      ref={isLast ? lastElementRef : null}
                    >
                      <Card
                        className={`link-card h-100 ${
                          link.loaded ? 'loaded' : ''
                        }`}
                      >
                        {link.imageUrl && (
                          <Card.Img
                            variant="top"
                            src={link.imageUrl}
                            alt={link.linkTitle}
                          />
                        )}
                        <Card.Body className="d-flex flex-column">
                          <div
                            className="flex-grow-1"
                            onClick={() => window.open(link.url, '_blank')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center mb-2">
                              {link.faviconUrl && (
                                <img
                                  src={link.faviconUrl}
                                  alt="favicon"
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    marginRight: '8px',
                                  }}
                                />
                              )}
                              <Card.Title className="mb-0">
                                {link.linkTitle}
                              </Card.Title>
                            </div>
                            <Card.Text>
                              {link.linkDescription || 'No description'}
                            </Card.Text>
                            {link.tags?.length > 0 && (
                              <div className="mb-2">
                                {link.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="badge rounded-pill bg-primary me-2"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
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
                  );
                })}
              </div>

              {loadingMore && (
                <div className="text-center py-3">
                  <Spinner animation="border" />
                </div>
              )}

              {!loadingMore && hasMore && (
                <div className="text-center py-3">
                  <Button
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      fetchLinks(nextPage);
                    }}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <LinkFormModal
          show={showModal}
          handleClose={() => {
            setShowModal(false);
            setEditLink(null);
            setQuickSaveUrl(null);
          }}
          onSaved={() => {
            toast.success('Link saved');
            resetAndFetch();
          }}
          editLink={editLink}
          quickSaveUrl={quickSaveUrl}
        />
      )}
    </main>
  );
}
