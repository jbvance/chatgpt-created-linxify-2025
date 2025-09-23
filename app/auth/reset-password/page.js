// app/auth/reset-password/page.js
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';

const schema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'At least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: data.password }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || 'Something went wrong');
    } else {
      setMessage(json.message);
      // Redirect to login after a short delay
      setTimeout(() => router.push('/auth/login'), 2000);
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <main className="container py-5">
        <Alert variant="danger">Invalid password reset link</Alert>
      </main>
    );
  }

  return (
    <main className="container py-5" style={{ maxWidth: '500px' }}>
      <h1 className="mb-4 text-center">Reset Password</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter new password"
            {...register('password')}
            isInvalid={!!errors.password}
          />
          <Form.Control.Feedback type="invalid">
            {errors.password?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="confirmPassword">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm new password"
            {...register('confirmPassword')}
            isInvalid={!!errors.confirmPassword}
          />
          <Form.Control.Feedback type="invalid">
            {errors.confirmPassword?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          className="w-100"
        >
          {loading ? (
            <Spinner size="sm" animation="border" />
          ) : (
            'Reset Password'
          )}
        </Button>
      </Form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading login...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
