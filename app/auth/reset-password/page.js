'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

// ✅ Suspense-safe token reader
import { useSearchParams } from 'next/navigation';
function TokenHandler({ onReady }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  if (token) onReady(token);
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const onSubmit = async ({ password, confirmPassword }) => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to reset password');
      }

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '400px' }}>
      {/* Suspense wrapper for token */}
      <Suspense fallback={null}>
        <TokenHandler onReady={setToken} />
      </Suspense>

      <h2 className="mb-4">Reset Password</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {success ? (
        <Alert variant="success">
          Your password has been reset! Redirecting to login…
        </Alert>
      ) : token ? (
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min length is 6' },
              })}
            />
            {errors.password && (
              <small className="text-danger">{errors.password.message}</small>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
              })}
            />
            {errors.confirmPassword && (
              <small className="text-danger">
                {errors.confirmPassword.message}
              </small>
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
              'Reset Password'
            )}
          </Button>
        </Form>
      ) : (
        <Alert variant="warning">No reset token found in URL.</Alert>
      )}
    </div>
  );
}
{
  /* 🔹 Back to login link */
}
<div className="text-center mt-3">
  <a href="/auth/login">Back to login</a>
</div>;
