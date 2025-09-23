'use client';

import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to process request');
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '400px' }}>
      <h2 className="mb-4">Forgot Password</h2>

      {submitted ? (
        <Alert variant="success">
          If an account exists with that email, you’ll receive a password reset
          link shortly.
        </Alert>
      ) : (
        <Form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <small className="text-danger">{errors.email.message}</small>
            )}
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-100"
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </Form>
      )}

      {/* 🔹 Back to login link */}
      <div className="text-center mt-3">
        <a href="/auth/login">Back to login</a>
      </div>
    </div>
  );
}
