// <mark>HIGHLIGHT</mark>: This file is being refactored to use a Suspense boundary.
// app/signin/page.tsx
'use client';

import { Suspense } from 'react'; // <mark>HIGHLIGHT</mark>: Import Suspense
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import { Github } from 'react-bootstrap-icons';
import Spinner from 'react-bootstrap/Spinner';

const schema = yup
  .object({
    email: yup
      .string()
      .email('Must be a valid email')
      .required('Email is required'),
    password: yup.string().required('Password is required'),
  })
  .required();

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setError(null);
    try {
      const response = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (!response?.ok || response.error) {
        throw new Error(response?.error || 'Invalid email or password');
      }

      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <>
      <h2 className="text-center mb-4">Sign In</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            {...register('email')}
            isInvalid={!!errors.email}
          />
          <Form.Control.Feedback type="invalid">
            {errors.email?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            {...register('password')}
            isInvalid={!!errors.password}
          />
          <Form.Control.Feedback type="invalid">
            {errors.password?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Button disabled={isSubmitting} type="submit" className="w-100">
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
      </Form>
      <div className="text-center my-3">or</div>
      <Button
        variant="outline-secondary"
        className="w-100"
        onClick={() => signIn('github', { callbackUrl })}
      >
        <Github className="me-2" /> Sign In with GitHub
      </Button>
    </>
  );
}

//The default export now wraps the form in Suspense.
export default function SignInPage() {
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <Suspense fallback={<Spinner animation="border" />}>
            <SignInForm />
          </Suspense>
        </Card.Body>
      </Card>
    </Container>
  );
}
