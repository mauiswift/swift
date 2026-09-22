import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || 'Unable to request a password reset.');
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request a password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your account email and we will send a reset link.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded border p-3" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button className="w-full rounded bg-slate-900 p-3 font-medium text-white disabled:opacity-50" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <Link className="mt-5 block text-center text-sm text-slate-600 underline" to="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
