"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to verify your account.",
      });

      router.push("/login");
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&display=swap');
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
        }}>
          {/* Back to home */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px',
              textDecoration: 'none',
              marginBottom: '24px',
            }}
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          {/* Card */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
          }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Link href="/" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  background: '#22c55e',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}>
                  <MessageCircle size={24} />
                </div>
                <span style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#111827',
                }}>Take</span>
              </Link>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: '28px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 8px',
              }}>
                Create your account
              </h1>
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                margin: 0,
              }}>
                Start selling on WhatsApp in minutes
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#22c55e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#22c55e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#22c55e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '48px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = '#16a34a')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#22c55e')}
              >
                {isLoading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                Create Account
              </button>
            </form>

            {/* Footer */}
            <p style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280',
              marginTop: '24px',
              marginBottom: 0,
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{
                color: '#22c55e',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#9ca3af',
            marginTop: '24px',
            lineHeight: 1.6,
          }}>
            By creating an account, you agree to our{' '}
            <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
