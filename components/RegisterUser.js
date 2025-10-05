// <mark>HIGHLIGHT</mark>: This is a new file for the user registration page.
// app/register/page.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';

const schema = yup
  .object({
    clientFirstName: yup.string().required('First name is required'),
    clientLastName: yup.string().optional(),
    email: yup
      .string()
      .email('Must be a valid email')
      .required('Email is required'),
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
  })
  .required();

export default function RegisterPage({ allowRegistration }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      clientFirstName: '',
      clientLastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setError(null);
    try {
      // 1. Call our registration API route
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // 2. Automatically sign in the new user
      const signInResponse = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (signInResponse?.error) {
        throw new Error(signInResponse.error);
      }

      // 3. Redirect to the dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    }
  };

  // ONLY CONTINUE IF ALLOW_NEW_USERS ENV VARIABLE IS "true"
  if (allowRegistration !== 'true') {
    return <h1>New User Registration is not allowed at this time.</h1>;
  }

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Create Account</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form noValidate onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="clientFirstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                {...register('clientFirstName')}
                isInvalid={!!errors.clientFirstName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.clientFirstName?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="clientLastName">
              <Form.Label>Last Name (Optional)</Form.Label>
              <Form.Control type="text" {...register('clientLastName')} />
            </Form.Group>

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

            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                {...register('confirmPassword')}
                isInvalid={!!errors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button disabled={isSubmitting} type="submit" className="w-100">
              {isSubmitting ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
