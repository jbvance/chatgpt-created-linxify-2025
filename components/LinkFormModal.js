// components/LinkFormModal.js
'use client';

import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';

const schema = yup.object().shape({
  url: yup.string().url('Must be a valid URL').required('URL is required'),
  linkTitle: yup.string().required('Title is required'),
  linkDescription: yup.string().optional(),
});

export default function LinkFormModal({
  show,
  handleClose,
  onSaved,
  editLink,
}) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: editLink || { url: '', linkTitle: '', linkDescription: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (editLink) {
        await fetch(`/api/links/${editLink.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      reset();
      handleClose();
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{editLink ? 'Edit Link' : 'Add Link'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>URL</Form.Label>
            <Form.Control
              type="text"
              {...register('url')}
              isInvalid={!!errors.url}
            />
            <Form.Control.Feedback type="invalid">
              {errors.url?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
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
              rows={3}
              {...register('linkDescription')}
              isInvalid={!!errors.linkDescription}
            />
            <Form.Control.Feedback type="invalid">
              {errors.linkDescription?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
