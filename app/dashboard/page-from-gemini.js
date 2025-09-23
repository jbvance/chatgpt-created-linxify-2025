'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Spinner,
  Form,
  Row,
  Col,
  Dropdown,
} from 'react-bootstrap';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  // Filters & Sorting
  const [searchText, setSearchText] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');

  const observerRef = useRef(null);

  // ✅ Memoized fetch function
  const fetchLinks = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          pageSize: '10',
        });

        if (searchText) params.append('q', searchText);
        if (tagFilter) params.append('tag', tagFilter);
        if (categoryFilter) params.append('categoryId', categoryFilter);
        if (sortOrder) params.append('sort', sortOrder);

        const res = await fetch(`/api/links?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch links');
        const data = await res.json();

        setLinks((prev) =>
          append ? [...prev, ...(data.links || [])] : data.links || []
        );
        setHasMore(data.links.length >= 10);
      } catch (err) {
        console.error('Error fetching links:', err);
        toast.error('Failed to fetch links');
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [searchText, tagFilter, categoryFilter, sortOrder]
  );

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true);
      fetchLinks(1, false);
      setPage(1);
    }
  }, [status, searchText, tagFilter, categoryFilter, sortOrder, fetchLinks]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingMore) {
          setFetchingMore(true);
          const nextPage = page + 1;
          fetchLinks(nextPage, true);
          setPage(nextPage);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [hasMore, loading, page, fetchingMore, fetchLinks]);

  if (loading && page === 1) {
    // Skeleton loaders
    return (
      <div className="container py-4">
        <h2 className="mb-3">My Links</h2>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mb-3 placeholder-glow">
            <Card.Body>
              <span className="placeholder col-6"></span>
              <p className="placeholder col-7"></p>
              <p className="placeholder col-4"></p>
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">My Links</h2>

      {/* 🔹 Filters & Sorting */}
      <Form className="mb-4">
        <Row>
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Search by title, description, or URL"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              type="text"
              placeholder="Filter by tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Dropdown onSelect={(val) => setSortOrder(val)}>
              <Dropdown.Toggle variant="outline-secondary">
                Sort:{' '}
                {sortOrder === 'newest'
                  ? 'Newest'
                  : sortOrder === 'oldest'
                    ? 'Oldest'
                    : 'A–Z'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="newest">Newest</Dropdown.Item>
                <Dropdown.Item eventKey="oldest">Oldest</Dropdown.Item>
                <Dropdown.Item eventKey="alpha">Alphabetical</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      </Form>

      {/* 🔹 Empty state */}
      {links.length === 0 ? (
        <div className="text-center mt-5">
          <Image
            src="/empty-links.svg"
            alt="No links illustration"
            width={300}
            height={200}
          />
          <p className="mt-3 text-muted">No links saved yet.</p>
        </div>
      ) : (
        <>
          {links.map((link) => (
            <Card key={link.id || Math.random()} className="mb-3 link-card">
              <Card.Body>
                {/* Title row */}
                <div className="d-flex align-items-center mb-2">
                  {link.faviconUrl ? (
                    <Image
                      src={link.faviconUrl}
                      alt="favicon"
                      width={20}
                      height={20}
                      className="me-2"
                      unoptimized
                    />
                  ) : null}
                  <Card.Title className="mb-0">
                    {link.linkTitle || link.url || 'Untitled'}
                  </Card.Title>
                </div>

                {/* Description */}
                {link.linkDescription ? (
                  <Card.Text>{link.linkDescription}</Card.Text>
                ) : (
                  <Card.Text className="text-muted">
                    No description available.
                  </Card.Text>
                )}

                {/* Tags */}
                {Array.isArray(link.tags) && link.tags.length > 0 && (
                  <div className="mb-2">
                    {link.tags.map((tag, i) => (
                      <span key={i} className="badge bg-secondary me-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Button size="sm" variant="outline-secondary">
                      Edit
                    </Button>{' '}
                    <Button size="sm" variant="outline-danger">
                      Delete
                    </Button>
                  </div>
                  <a
                    href={`/read/${link.id}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Reader Mode
                  </a>
                </div>
              </Card.Body>
            </Card>
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={observerRef} className="text-center py-3">
            {fetchingMore && <Spinner animation="border" />}
            {!hasMore && <p className="text-muted">No more links</p>}
          </div>

          {/* Load More fallback */}
          {hasMore && !fetchingMore && (
            <div className="text-center">
              <Button
                variant="outline-primary"
                onClick={() => {
                  setFetchingMore(true);
                  const nextPage = page + 1;
                  fetchLinks(nextPage, true);
                  setPage(nextPage);
                }}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
