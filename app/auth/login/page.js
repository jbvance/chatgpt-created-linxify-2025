'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { useSearchParams } from 'next/navigation';
function CallbackHandler({ onReady }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  onReady(callbackUrl);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState('/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error);
      } else if (res?.url) {
        router.push(res.url);
      }
    } catch (err) {
      console.error(err);
      setError('Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '400px' }}>
      <Suspense fallback={null}>
        <CallbackHandler onReady={setCallbackUrl} />
      </Suspense>

      <h2 className="mb-4">Sign In</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && (
            <small className="text-danger">{errors.email.message}</small>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && (
            <small className="text-danger">{errors.password.message}</small>
          )}
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-100"
        >
          {loading ? <Spinner animation="border" size="sm" /> : 'Sign In'}
        </Button>
      </Form>

      {/* 🔹 Forgot password link */}
      <div className="text-center mt-3">
        <a href="/auth/forgot-password">Forgot your password?</a>
      </div>
    </div>
  );
}
