"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useIsMounted } from "@/lib/use-is-mounted";
import { cn } from "@/lib/utils";


// ──────────────────────────────────────────────────────────────────────────────
// Context  (state-context-interface 패턴)
// ──────────────────────────────────────────────────────────────────────────────

type AuthMode = "login" | "signup";

interface AuthContextValue {
  open: boolean;
  mode: AuthMode;
  openWith: (mode: AuthMode) => void;
  setMode: (mode: AuthMode) => void;
  close: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext: <AuthModal> 내부에서만 사용하세요");
  return ctx;
}

// ──────────────────────────────────────────────────────────────────────────────
// Validation (SignUpRequest DTO 정규식 일치)
// ──────────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PASSWORD_RE =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_=+-])[A-Za-z\d~!@#$%^&*()_=+-]{8,64}$/;
const DISPLAY_NAME_MAX = 16;

function validateDisplayName(v: string): string | undefined {
  if (!v.trim()) return "닉네임을 입력해 주세요";
  if (v.length > DISPLAY_NAME_MAX) return `닉네임은 ${DISPLAY_NAME_MAX}자 이내로 입력해 주세요`;
  return undefined;
}

function validateEmail(v: string): string | undefined {
  if (!v.trim()) return "이메일을 입력해 주세요";
  if (!EMAIL_RE.test(v)) return "올바른 이메일 형식이 아닙니다";
  return undefined;
}

function validatePassword(v: string): string | undefined {
  if (!v) return "비밀번호를 입력해 주세요";
  if (v.length < 8) return "비밀번호는 8자 이상이어야 합니다";
  if (v.length > 64) return "비밀번호는 64자 이내로 입력해 주세요";
  if (!PASSWORD_RE.test(v)) return "영문, 숫자, 특수문자(~!@#$%^&*()_=+-)를 모두 포함해야 합니다";
  return undefined;
}

/** 이메일 중복 검사 — TODO: 실제 API 엔드포인트 연결 */
async function checkEmailDuplicate(email: string): Promise<boolean> {
  // const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
  // return res.ok; // true = 사용 가능
  void email;
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// FieldError — 인라인 에러 메시지
// ──────────────────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] text-destructive leading-tight">
      {message}
    </p>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// VerifyCodeForm  —  6자리 인증 코드 입력
// ──────────────────────────────────────────────────────────────────────────────

function VerifyCodeForm({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return;

    setLoading(true);
    setError(undefined);

    try {
      const res = await fetch("/auth/email/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        let message = "인증에 실패했습니다";
        try {
          const data = await res.json();
          if (data.message) message = data.message;
        } catch {
          if (res.status === 400) message = "인증 코드가 올바르지 않습니다";
          if (res.status === 410) message = "인증 코드가 만료되었습니다";
        }
        setError(message);
        setCode("");
        return;
      }

      setVerified(true);
    } catch {
      setError("서버와 통신할 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [code, email, onVerified]);

  // 6자리 모두 입력되면 자동 제출
  const handleChange = useCallback(
    (value: string) => {
      setCode(value);
      setError(undefined);
    },
    [],
  );

  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code, handleVerify]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;

    setResending(true);
    setError(undefined);

    try {
      const res = await fetch("/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("인증 메일 재전송에 실패했습니다");
        return;
      }

      setResendCooldown(60);
    } catch {
      setError("서버와 통신할 수 없습니다");
    } finally {
      setResending(false);
    }
  }, [email, resendCooldown]);

  if (verified) {
    return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-base font-medium">이메일 인증이 완료되었습니다</p>
          <p className="text-sm text-muted-foreground">
            이제 로그인하여 서비스를 이용하실 수 있습니다.
          </p>
        </div>
        <Button type="button" className="w-full" onClick={onVerified}>
          로그인하기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* 안내 문구 */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{email}</strong>
          <br />
          으로 발송된 인증 코드를 입력해 주세요.
        </p>
      </div>

      {/* 6자리 OTP 입력 */}
      <div className="flex flex-col items-center gap-3">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={handleChange}
          disabled={loading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        {error && <FieldError message={error} />}

        {loading && (
          <p className="text-[13px] text-muted-foreground">인증 중…</p>
        )}
      </div>

      {/* 재전송 */}
      <p className="text-center text-sm text-muted-foreground">
        메일을 받지 못하셨나요?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className={cn(
            "font-medium underline-offset-4 hover:underline transition-colors duration-150",
            resendCooldown > 0 || resending
              ? "text-muted-foreground cursor-not-allowed"
              : "text-foreground",
          )}
        >
          {resending
            ? "전송 중…"
            : resendCooldown > 0
              ? `재전송 (${resendCooldown}초)`
              : "다시 보내기"}
        </button>
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Form variants  (patterns-explicit-variants: boolean prop 대신 명시적 컴포넌트)
// ──────────────────────────────────────────────────────────────────────────────

function LoginForm() {
  const { setMode, close } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!email.trim() || !password) return;

      setLoading(true);
      setApiError(undefined);

      try {
        const res = await fetch("/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          let message = "로그인에 실패했습니다";
          try {
            const data = await res.json();
            if (data.message) message = data.message;
          } catch {
            if (res.status === 401) message = "이메일 또는 비밀번호가 올바르지 않습니다";
          }
          setApiError(message);
          return;
        }

        // 로그인 성공 — 모달 닫고 페이지 새로고침
        close();
        window.location.reload();
      } catch {
        setApiError("서버와 통신할 수 없습니다");
      } finally {
        setLoading(false);
      }
    },
    [email, password, close],
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {apiError && (
        <p role="alert" className="text-[13px] text-destructive leading-tight text-center">
          {apiError}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">이메일</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">비밀번호</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading ? "로그인 중…" : "로그인"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <button
          type="button"
          onClick={() => setMode("signup")}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          회원가입
        </button>
      </p>
    </form>
  );
}

function SignupForm() {
  const { setMode } = useAuthContext();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 필드별 touched 상태 — blur 후에만 에러 표시
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // 제출 시도 여부 — 한 번 제출하면 모든 필드 에러 즉시 표시
  const [submitted, setSubmitted] = useState(false);
  // 이메일 중복 검사 상태
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailDupError, setEmailDupError] = useState<string | undefined>();
  // API 요청 상태
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [signupSuccess, setSignupSuccess] = useState(false);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  // 필드별 에러 계산 (매 렌더마다 — 값이 바뀔 때마다 실시간 반영)
  const errors = {
    displayName: validateDisplayName(displayName),
    email: validateEmail(email) ?? emailDupError,
    password: validatePassword(password),
  };

  // 특정 필드의 에러를 보여줄지 결정 (touched 또는 submitted)
  const showError = useCallback(
    (field: string) => submitted || !!touched[field],
    [submitted, touched],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitted(true);

      // 로컬 유효성 검사
      const nameErr = validateDisplayName(displayName);
      const emailErr = validateEmail(email);
      const pwErr = validatePassword(password);

      if (nameErr || emailErr || pwErr) return;

      // 이메일 중복 검사
      setEmailChecking(true);
      setEmailDupError(undefined);

      try {
        const available = await checkEmailDuplicate(email);
        if (!available) {
          setEmailDupError("이미 사용 중인 이메일입니다");
          setEmailChecking(false);
          return;
        }
      } catch {
        setEmailDupError("이메일 확인 중 오류가 발생했습니다");
        setEmailChecking(false);
        return;
      }

      setEmailChecking(false);

      // 회원가입 API 호출
      setLoading(true);
      setApiError(undefined);

      try {
        const res = await fetch("/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, displayName }),
        });

        if (!res.ok) {
          // JSON 파싱 실패 가능성 대비
          let message = "회원가입에 실패했습니다";
          try {
            const data = await res.json();
            if (data.message) message = data.message;
          } catch {
            if (res.status === 409) message = "이미 사용 중인 이메일입니다";
          }
          setApiError(message);
          return;
        }

        setSignupSuccess(true);
      } catch {
        setApiError("서버와 통신할 수 없습니다");
      } finally {
        setLoading(false);
      }
    },
    [displayName, email, password],
  );

  // 이메일 변경 시 중복 에러 초기화
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      setEmailDupError(undefined);
    },
    [],
  );

  if (signupSuccess) {
    return <VerifyCodeForm email={email} onVerified={() => setMode("login")} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {apiError && (
        <p role="alert" className="text-[13px] text-destructive leading-tight text-center">
          {apiError}
        </p>
      )}

      {/* 닉네임 — @NotBlank @Size(max=16) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-displayName">닉네임</Label>
        <Input
          id="signup-displayName"
          type="text"
          placeholder="홍길동"
          autoComplete="nickname"
          maxLength={DISPLAY_NAME_MAX}
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={() => markTouched("displayName")}
          aria-invalid={showError("displayName") && !!errors.displayName}
          aria-describedby={showError("displayName") && errors.displayName ? "err-displayName" : undefined}
        />
        {showError("displayName") && (
          <FieldError message={errors.displayName} />
        )}
      </div>

      {/* 이메일 — @NotBlank @Pattern(email) + 중복 검사 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">이메일</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={handleEmailChange}
          onBlur={() => markTouched("email")}
          aria-invalid={showError("email") && !!errors.email}
          aria-describedby={showError("email") && errors.email ? "err-email" : undefined}
        />
        {showError("email") && <FieldError message={errors.email} />}
      </div>

      {/* 비밀번호 — @NotBlank @Pattern(영문+숫자+특수) @Size(8..64) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">비밀번호</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="영문, 숫자, 특수문자 포함 8자 이상"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched("password")}
          aria-invalid={showError("password") && !!errors.password}
          aria-describedby={showError("password") && errors.password ? "err-password" : undefined}
        />
        {showError("password") && (
          <FieldError message={errors.password} />
        )}
      </div>

      <Button type="submit" disabled={emailChecking || loading} className="mt-1 w-full">
        {emailChecking || loading ? "처리 중…" : "회원가입"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <button
          type="button"
          onClick={() => setMode("login")}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          로그인
        </button>
      </p>
    </form>
  );
}

const MODE_TITLE: Record<AuthMode, string> = {
  login: "로그인",
  signup: "회원가입",
};

// ──────────────────────────────────────────────────────────────────────────────
// AuthModal.Content  —  createPortal + FocusScope (접근성: focus trap, Escape)
// ──────────────────────────────────────────────────────────────────────────────

function AuthModalContent() {
  const { open, mode, setMode, close } = useAuthContext();
  const mounted = useIsMounted();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape 키 처리
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // 모달 오픈 시 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    /* 전체 화면 컨테이너 */
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm auth-overlay-in"
        aria-hidden="true"
        onClick={close}
      />

      {/* 포커스 트랩 + 다이얼로그 */}
      <FocusScope loop trapped>
        {/*
          FocusScope의 래퍼 div는 width 미설정 → w-full이 콘텐츠 크기로 제한됨.
          CSS min()으로 부모 너비에 의존하지 않는 고정 폭 사용.
        */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-dialog-title"
          className="relative bg-background border rounded-2xl shadow-2xl px-8 py-6 sm:px-10 sm:py-8 flex flex-col gap-5 auth-modal-in w-[min(480px,calc(100vw-2rem))]"
        >
          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* 제목 */}
          <h2
            id="auth-dialog-title"
            className="text-xl font-semibold leading-none"
          >
            {MODE_TITLE[mode]}
          </h2>

          {/* 폼 variant (patterns-explicit-variants) */}
          {mode === "login" ? <LoginForm /> : <SignupForm />}
        </div>
      </FocusScope>
    </div>,
    document.body,
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// AuthModal.Trigger  —  툴바와 동일한 플로팅 패널 스타일 단일 아이콘 버튼
// ──────────────────────────────────────────────────────────────────────────────

interface AuthModalTriggerProps {
  className?: string;
}

function AuthModalTrigger({ className }: AuthModalTriggerProps) {
  const { openWith } = useAuthContext();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* 툴바와 동일한 플로팅 패널 컨테이너 */}
          <aside
            className={cn(
              "flex items-center rounded-lg border bg-background/80 p-1.5 shadow-lg backdrop-blur",
              className,
            )}
          >
            <button
              type="button"
              onClick={() => openWith("login")}
              aria-label="계정 메뉴 열기"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
            >
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </aside>
        </TooltipTrigger>
        <TooltipContent side="left">계정</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// AuthModal root  (Object.assign compound component 패턴)
// ──────────────────────────────────────────────────────────────────────────────

interface AuthModalProps {
  children: React.ReactNode;
}

function AuthModalRoot({ children }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  // rerender-functional-setstate: 콜백 내 상태 업데이트 안정화
  const openWith = useCallback((m: AuthMode) => {
    setMode(m);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <AuthContext.Provider value={{ open, mode, openWith, setMode, close }}>
      {children}
    </AuthContext.Provider>
  );
}

// Compound component (architecture-compound-components)
export const AuthModal = Object.assign(AuthModalRoot, {
  Trigger: AuthModalTrigger,
  Content: AuthModalContent,
});
