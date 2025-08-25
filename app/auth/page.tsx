import { redirect } from 'next/navigation';

export default function AuthPage() {
  // Redirect to signin by default
  redirect('/auth/signin');
}