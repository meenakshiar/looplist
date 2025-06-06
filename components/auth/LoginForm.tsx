// PRD: Auth
"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useAuthStore } from "@/store/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/dashboard";

  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("LoginForm: Attempting login...");
      // Login the user
      await login(email, password);
      const func =  await login(email,password);
      console.log(func);
      
      console.log("LoginForm: Login successful, redirecting to:", redirectUrl);

      // First close the modal
      onSuccess();

      // Then redirect to the dashboard or specified redirect URL
      router.push(redirectUrl);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials or email not verified");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        variant="bordered"
        isRequired
        autoComplete="email"
        isDisabled={isLoading}
      />

      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        variant="bordered"
        isRequired
        autoComplete="current-password"
        isDisabled={isLoading}
      />

      {error && <div className="text-danger text-sm px-1">{error}</div>}

      <div className="flex justify-between items-center mt-2">
        <Link href="/auth/reset" size="sm" color="primary">
          Forgot password?
        </Link>
        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          isDisabled={!email || !password || isLoading}
        >
          Log In
        </Button>
      </div>
    </form>
  );
}
