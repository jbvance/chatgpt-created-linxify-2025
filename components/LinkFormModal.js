'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import CreatableSelect from 'react-select/creatable';
import toast from 'react-hot-toast';

const schema = yup.object({
  url: yup.string().url('Must be a valid URL').required('URL is required'),
  linkTitle: yup.string().required('Title is required'),
  linkDescription: yup.string().nullable(),
  faviconUrl: yup.string().nullable(),
  imageUrl: yup.string().nullable(),
  tags: yup.array().of(yup.string()),
  categoryIds: yup.array().of(yup.number()),
});

export default function LinkFormModal({
  show,
  handleClose,
  onSaved,
  editLink,
  quickSaveUrl,
}) {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [scraping, setScraping] = useState(false); // 🔹 scraping state

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      url: '',
      linkTitle: '',
      linkDescription: '',
      faviconUrl: null,
      imageUrl: null,
      tags: [],
      categoryIds: [],
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editLink) {
      reset({
        url: editLink.url || '',
        linkTitle: editLink.linkTitle || '',
        linkDescription: editLink.linkDescription || '',
        faviconUrl: editLink.faviconUrl || null,
        imageUrl: editLink.imageUrl || null,
        tags: editLink.tags || [],
        categoryIds: editLink.categories?.map((c) => c.categoryId) || [],
      });
    } else if (quickSaveUrl) {
      (async () => {
        setScraping(true);
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: quickSaveUrl }),
          });
          if (res.ok) {
            const data = await res.json();
            reset({
              url: quickSaveUrl,
              linkTitle: data.title || '',
              linkDescription: data.description || '',
              faviconUrl: data.favicon || null,
              imageUrl: data.image || null,
              tags: [],
              categoryIds: [],
            });
          } else {
            reset({
              url: quickSaveUrl,
              linkTitle: '',
              linkDescription: '',
              faviconUrl: null,
              imageUrl: null,
              tags: [],
              categoryIds: [],
            });
          }
        } catch (err) {
          console.error('Scraping failed', err);
          reset({
            url: quickSaveUrl,
            linkTitle: '',
            linkDescription: '',
            faviconUrl: null,
            imageUrl: null,
            tags: [],
            categoryIds: [],
          });
        }
        setScraping(false);
      })();
    } else {
      reset({
        url: '',
        linkTitle: '',
        linkDescription: '',
        faviconUrl: null,
        imageUrl: null,
        tags: [],
        categoryIds: [],
      });
    }
  }, [editLink, quickSaveUrl, reset]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await fetch(
        editLink ? `/api/links/${editLink.id}` : '/api/links',
        {
          method: editLink ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (res.ok) {
        toast.success(`Link ${editLink ? 'updated' : 'added'}`);
        onSaved();
        handleClose();
      } else {
        toast.error('Failed to save link');
      }
    } catch (err) {
      toast.error('Error saving link');
    }
    setSaving(false);
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{editLink ? 'Edit Link' : 'Add Link'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="position-relative">
          {/* 🔹 Overlay */}
          {scraping && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 10,
              }}
            >
              <Spinner animation="border" className="mb-2" />
              <div className="text-muted small">Fetching link details…</div>
            </div>
          )}

          <fieldset disabled={scraping || saving}>
            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control {...register('url')} isInvalid={!!errors.url} />
              <Form.Control.Feedback type="invalid">
                {errors.url?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                {...register('linkTitle')}
                isInvalid={!!errors.linkTitle}
              />
              <Form.Control.Feedback type="invalid">
                {errors.linkTitle?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                {...register('linkDescription')}
              />
            </Form.Group>

            {/* Tags */}
            <Form.Group className="mb-3">
              <Form.Label>Tags</Form.Label>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <>
                    <CreatableSelect
                      isMulti
                      {...field}
                      value={field.value.map((t) => ({ label: t, value: t }))}
                      onChange={(selected) =>
                        field.onChange(selected.map((s) => s.value))
                      }
                      isDisabled={scraping || saving}
                    />
                    {field.value.length > 0 && (
                      <div className="mt-2">
                        {field.value.map((tag) => (
                          <span
                            key={tag}
                            className="badge rounded-pill bg-primary me-2"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              />
            </Form.Group>

            {/* Categories */}
            <Form.Group className="mb-3">
              <Form.Label>Categories</Form.Label>
              <Controller
                control={control}
                name="categoryIds"
                render={({ field }) => (
                  <CreatableSelect
                    isMulti
                    {...field}
                    value={categories
                      .filter((c) => field.value.includes(c.id))
                      .map((c) => ({
                        label: c.categoryDescription,
                        value: c.id,
                      }))}
                    options={categories.map((c) => ({
                      label: c.categoryDescription,
                      value: c.id,
                    }))}
                    onChange={(selected) =>
                      field.onChange(selected.map((s) => s.value))
                    }
                    isDisabled={scraping || saving}
                  />
                )}
              />
            </Form.Group>

            {/* Hidden fields */}
            <Form.Control type="hidden" {...register('faviconUrl')} />
            <Form.Control type="hidden" {...register('imageUrl')} />
          </fieldset>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={saving || scraping}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || scraping}>
            {saving ? <Spinner size="sm" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
