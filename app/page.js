// <mark>HIGHLIGHT</mark>: This is the new, comprehensive splash page.
// app/page.tsx
'use client';

import Link from 'next/link';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Collection, KeyboardFill, Magic } from 'react-bootstrap-icons';

export default function SplashPage() {
  return (
    <>
      <style type="text/css">
        {`
          .hero-section {
            background: linear-gradient(45deg, #5E35B1, #7E57C2);
            color: white;
            padding: 8rem 0;
            text-align: center;
          }
          .address-bar-demo {
            background-color: #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            font-family: monospace;
            color: #343a40;
            text-align: left;
            overflow: hidden;
            white-space: nowrap;
            border: 1px solid #ced4da;
            max-width: 500px;
            margin: 2rem auto 0;
          }
          .typing-animation {
            display: inline-block;
            animation: typing 2s steps(12, end), blink-caret .75s step-end infinite;
            border-right: .15em solid orange;
          }
          @keyframes typing {
            from { width: 0 }
            to { width: 100% }
          }
          @keyframes blink-caret {
            from, to { border-color: transparent }
            50% { border-color: orange; }
          }
          .feature-icon {
            font-size: 3rem;
            color: #5E35B1;
          }
        `}
      </style>

      {/* Hero Section */}
      <div className="hero-section">
        <Container>
          <h1>Save Links at the Speed of Thought</h1>
          <p className="lead my-4">
            Stop interrupting your workflow. Instantly save, categorize, and
            find any link with a simple prefix.
          </p>
          <Link href="/register" className="btn btn-light btn-lg">
            Get Started for Free
          </Link>
          <div className="address-bar-demo">
            <span className="typing-animation">linxify.net/add?url=</span>
            https://news.google.com
          </div>
        </Container>
      </div>

      {/* How It Works Section */}
      <Container className="text-center py-5">
        <h2>Save in Seconds, Not Clicks</h2>
        <p className="text-muted mb-5">
          A revolutionary workflow to capture inspiration instantly.
        </p>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <div className="feature-icon mb-3">
                  <Magic />
                </div>
                <Card.Title>1. Prefix It</Card.Title>
                <Card.Text>
                  Find a page you want to save. In the address bar, simply type
                  your domain in front of the URL.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <div className="feature-icon mb-3">
                  <KeyboardFill />
                </div>
                <Card.Title>2. Hit Enter</Card.Title>
                <Card.Text>
                  That&apos;s it. Your link, its title, and its favicon are
                  automatically saved to your personal library.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <div className="feature-icon mb-3">
                  <Collection />
                </div>
                <Card.Title>3. Organize Later</Card.Title>
                <Card.Text>
                  Your link is securely saved. You can add descriptions, assign
                  categories, and find it anytime with a powerful search.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Final CTA */}
      <div className="bg-light text-center py-5">
        <Container>
          <h2>Ready to Streamline Your Workflow?</h2>
          <p className="lead my-4">
            Sign up now and start building your personal link library in
            seconds.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Sign Up Now
          </Link>
        </Container>
      </div>
    </>
  );
}
