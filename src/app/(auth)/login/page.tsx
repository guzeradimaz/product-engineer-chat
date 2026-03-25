import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-400">Sign in to your account</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-zinc-500">
          Or{" "}
          <Link href="/" className="text-zinc-400 hover:text-white underline">
            continue without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
