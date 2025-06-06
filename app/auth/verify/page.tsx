// PRD: Auth
"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useAuthStore } from "@/store/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email...");
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyEmail = useAuthStore((state) => state.verifyEmail);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Token is missing.");
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
        setMessage(
          "Your email has been verified successfully! You can now log in."
        );
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.message || "Failed to verify email. The token may have expired."
        );
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col gap-1 items-center">
          <h1 className="text-xl font-bold">Email Verification</h1>
        </CardHeader>

        <CardBody className="py-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-r-transparent rounded-full" />
              <p className="text-center">{message}</p>
            </div>
          )}

          {status === "success" && (
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
              <p>{message}</p>
            </div>
          )}

          {status === "error" && (
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
              <p>{message}</p>
              <p className="text-sm text-default-500">
                Need a new verification link?{" "}
                <Link href="/auth/resend" size="sm">
                  Resend verification email
                </Link>
              </p>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center">
          <Button
            color={status === "success" ? "primary" : "default"}
            variant="flat"
            onPress={() => router.push("/")}
          >
            {status === "success" ? "Go to Login" : "Back to Home"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
