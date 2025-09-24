'use client';

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  Suspense,
} from 'react';
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
import toast from 'react-hot-toast';
import CreatableSelect from 'react-select/creatable';

import CategorySidebar from '@/components/CategorySidebar';
import LinkFormModal from '@/components/LinkFormModal';

// 🔹 QuickSaveHandler now safe
import { useEffect as useEffectReact } from 'react';
function QuickSaveHandler({ onQuickSave }) {
  const searchParams = useSearchParams();
  const addUrl = searchParams.get('addUrl');

  useEffectReact(() => {
    if (addUrl) {
      onQuickSave(addUrl);
    }
  }, [addUrl, onQuickSave]);

  return null;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  // Links + paging
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

  // Filters / sort
  const [selectedTags, setSelectedTags] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest'); // newest|oldest|az|za
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Infinite scroll
  const observerRef = useRef();

  // ---------- Auth redirects ----------
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // ---------- Fetching ----------
  const fetchLinks = useCallback(
    async (pageNum, reset = false) => {
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

        // Fade-in after paint
        setTimeout(() => {
          setLinks((prev) => prev.map((l) => ({ ...l, loaded: true })));
        }, 50);
      } catch (err) {
        console.error('Error fetching links:', err);
        toast.error('Failed to load links');
      } finally {
        if (pageNum === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [pageSize]
  );

  const resetAndFetch = useCallback(() => {
    setLinks([]);
    setPage(1);
    fetchLinks(1, true);
  }, [fetchLinks]);

  // initial + session changes
  useEffect(() => {
    if (status === 'authenticated') {
      resetAndFetch();
    }
  }, [status, resetAndFetch]);

  // ---------- Delete ----------
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
      console.error(err);
      toast.error('Error deleting link');
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- Tags (collect unique from loaded page set) ----------
  const allTags = useMemo(() => {
    const tagSet = new Set();
    links.forEach((link) => (link.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [links]);

  // ---------- Client-side filtering/sorting ----------
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
        selectedTags.every((t) => link.tags?.includes(t))
      );
    }

    // Text search
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.linkTitle?.toLowerCase().includes(q) ||
          l.linkDescription?.toLowerCase().includes(q) ||
          l.url?.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
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
  }, [links, selectedCategoryId, selectedTags, search, sort]);

  // ---------- Infinite scroll ----------
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
    [loading, loadingMore, page, total, links.length, fetchLinks]
  );

  const hasMore = links.length < total;

  // ---------- QuickSave handler callback ----------
  const handleQuickSave = (url) => {
    setEditLink(null);
    setQuickSaveUrl(url);
    setShowModal(true);

    // clean up the URL
    const params = new URLSearchParams(window.location.search);
    params.delete('addUrl');
    const newUrl =
      window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', newUrl);
  };

  // ---------- Render ----------
  return (
    <main className="container-fluid py-5">
      {/* Suspense wrapper for useSearchParams */}
      <Suspense fallback={null}>
        <QuickSaveHandler onQuickSave={handleQuickSave} />
      </Suspense>

      <div className="row">
        <div className="col-md-3 mb-4">
          <CategorySidebar
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0">My Links</h1>
            <Button onClick={() => setShowModal(true)}>Add Link</Button>
          </div>

          {/* Filters */}
          <div className="row mb-4 g-3 align-items-end">
            <div className="col-md-4">
              {allTags.length > 0 && (
                <CreatableSelect
                  isMulti
                  placeholder="Filter by tags..."
                  value={selectedTags.map((t) => ({ label: t, value: t }))}
                  options={allTags.map((t) => ({ label: t, value: t }))}
                  onChange={(sel) => setSelectedTags(sel.map((s) => s.value))}
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

          {/* Skeletons */}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/empty-links.svg"
                alt="No links yet"
                width={150}
                height={120}
                style={{ opacity: 0.8 }}
              />
              <p className="mt-3 mb-0">
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
                        className={`link-card h-100 ${link.loaded ? 'loaded' : ''}`}
                      >
                        {link.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={link.imageUrl}
                            alt={link.linkTitle || 'Preview'}
                            className="img-fluid"
                            style={{ width: '100%', height: 'auto' }}
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
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={link.faviconUrl}
                                  alt="favicon"
                                  width={16}
                                  height={16}
                                  className="me-2"
                                />
                              )}
                              <Card.Title className="mb-0">
                                {link.linkTitle || link.url || 'Untitled'}
                              </Card.Title>
                            </div>
                            <Card.Text className="mb-2">
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
                            <div className="d-flex gap-2">
                              <a
                                href={`/read/${link.id}`}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                Reader Mode
                              </a>
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
