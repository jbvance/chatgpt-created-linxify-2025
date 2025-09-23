// components/CategorySidebar.js
'use client';

import { useEffect, useState } from 'react';
import { Button, ListGroup, InputGroup, Form, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function CategorySidebar({
  selectedCategoryId,
  onSelectCategory,
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load categories');
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryDescription: newCategory }),
      });
      if (res.ok) {
        toast.success('Category added');
        setNewCategory('');
        fetchCategories();
      } else {
        toast.error('Failed to add category');
      }
    } catch (err) {
      toast.error('Error adding category');
    }
    setSaving(false);
  };

  const handleSaveEdit = async (id) => {
    if (!editingText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryDescription: editingText }),
      });
      if (res.ok) {
        toast.success('Category updated');
        setEditingId(null);
        fetchCategories();
      } else {
        toast.error('Failed to update category');
      }
    } catch (err) {
      toast.error('Error updating category');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error('Failed to delete category');
      }
    } catch (err) {
      toast.error('Error deleting category');
    }
    setSaving(false);
  };

  return (
    <aside className="border-end pe-3">
      <h5 className="mb-3">Categories</h5>

      {/* New category input */}
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          placeholder="New category..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          disabled={saving}
        />
        <Button onClick={handleAdd} disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Add'}
        </Button>
      </InputGroup>

      {loading ? (
        <p>Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted small">No categories yet</p>
      ) : (
        <ListGroup>
          <ListGroup.Item
            active={selectedCategoryId === null}
            onClick={() => onSelectCategory(null)}
            style={{ cursor: 'pointer' }}
          >
            All Links
          </ListGroup.Item>
          {categories.map((cat) => (
            <ListGroup.Item
              key={cat.id}
              active={selectedCategoryId === cat.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectCategory(cat.id)}
            >
              {editingId === cat.id ? (
                <InputGroup size="sm">
                  <Form.Control
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <Button
                    variant="success"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(cat.id);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </Button>
                </InputGroup>
              ) : (
                <div className="d-flex justify-content-between align-items-center">
                  <span>{cat.categoryDescription}</span>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(cat.id);
                        setEditingText(cat.categoryDescription);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cat.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </aside>
  );
}
