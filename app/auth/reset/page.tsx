// PRD: Auth
"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid reset link. Token is missing.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col gap-1 items-center">
            <h1 className="text-xl font-bold">Reset Password</h1>
          </CardHeader>

          <CardBody className="py-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-danger/10 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-danger"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p>Invalid reset link. Token is missing.</p>
            </div>
          </CardBody>

          <CardFooter className="flex justify-center">
            <Button variant="flat" onPress={() => router.push("/")}>
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col gap-1 items-center">
            <h1 className="text-xl font-bold">Password Reset Successful</h1>
          </CardHeader>

          <CardBody className="py-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-success/10 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-success"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p>Your password has been reset successfully!</p>
              <p className="text-default-500 text-sm">
                You can now log in with your new password.
              </p>
            </div>
          </CardBody>

          <CardFooter className="flex justify-center">
            <Button color="primary" onPress={() => router.push("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col gap-1 items-center">
          <h1 className="text-xl font-bold">Reset Your Password</h1>
          <p className="text-default-500 text-sm">
            Enter your new password below
          </p>
        </CardHeader>

        <CardBody className="py-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              variant="bordered"
              description="Min. 8 characters"
              isRequired
              autoComplete="new-password"
              isDisabled={isLoading}
            />

            <Input
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              variant="bordered"
              isRequired
              autoComplete="new-password"
              isDisabled={isLoading}
            />

            {error && <div className="text-danger text-sm px-1">{error}</div>}

            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              isDisabled={!password || !confirmPassword || isLoading}
              className="mt-2"
            >
              Reset Password
            </Button>
          </form>
        </CardBody>

        <CardFooter className="flex justify-center">
          <Link href="/" className="text-sm">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
