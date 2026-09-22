import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.get('token') || '', new_password: password, confirm_password: confirm }),
    });
    const data = await response.json();
    if (!response.ok) setError(data?.detail || 'Unable to reset password.');
    else setMessage(data.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded border p-3" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
          <input className="w-full rounded border p-3" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button className="w-full rounded bg-slate-900 p-3 font-medium text-white">Reset password</button>
        </form>
        <Link className="mt-5 block text-center text-sm text-slate-600 underline" to="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
