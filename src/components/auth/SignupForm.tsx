"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error?.message ?? "Signup failed");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...register("email")}
          type="email"
          placeholder="Email"
          className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-zinc-500"
          autoComplete="email"
        />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>

      <div>
        <Input
          {...register("password")}
          type="password"
          placeholder="Password (min 8 characters)"
          className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-zinc-500"
          autoComplete="new-password"
        />
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
      </div>

      <div>
        <Input
          {...register("confirmPassword")}
          type="password"
          placeholder="Confirm password"
          className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-zinc-500"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-[#2563eb] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
