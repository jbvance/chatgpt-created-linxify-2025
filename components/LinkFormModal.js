// components/LinkFormModal.js
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
  tags: yup.array().of(yup.string()),
  categoryIds: yup.array().of(yup.number()),
});

export default function LinkFormModal({
  show,
  handleClose,
  onSaved,
  editLink,
}) {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

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
        tags: editLink.tags || [],
        categoryIds: editLink.categories?.map((c) => c.categoryId) || [],
      });
    } else {
      reset({
        url: '',
        linkTitle: '',
        linkDescription: '',
        tags: [],
        categoryIds: [],
      });
    }
  }, [editLink, reset]);

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
        <Modal.Body>
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

          <Form.Group className="mb-3">
            <Form.Label>Tags</Form.Label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <CreatableSelect
                  isMulti
                  {...field}
                  value={field.value.map((t) => ({ label: t, value: t }))}
                  onChange={(selected) =>
                    field.onChange(selected.map((s) => s.value))
                  }
                />
              )}
            />
          </Form.Group>

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
                />
              )}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
