import Link from "next/link";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
export default function Login() {
  return (
    <main className="login-page">
      <Link href="/">
        <Brand />
      </Link>
      <section className="panel login-panel">
        <div className="eyebrow">OWNER WORKSPACE</div>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your enquiries and quotes.</p>
        <LoginForm />
      </section>
      <Link href="/" className="back-link">
        Back to Wirral Garden Co.
      </Link>
    </main>
  );
}
