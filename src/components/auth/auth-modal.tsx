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
// Form variants  (patterns-explicit-variants: boolean prop 대신 명시적 컴포넌트)
// ──────────────────────────────────────────────────────────────────────────────

function LoginForm() {
  const { setMode } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: 로그인 로직 연결
  }, []);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

      <Button type="submit" className="mt-1 w-full">
        로그인
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
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: 회원가입 로직 연결
  }, []);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-nickname">닉네임</Label>
        <Input
          id="signup-nickname"
          type="text"
          placeholder="홍길동"
          autoComplete="nickname"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">이메일</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">비밀번호</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="8자 이상"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="mt-1 w-full">
        회원가입
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

// ──────────────────────────────────────────────────────────────────────────────
// Tab labels
// ──────────────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<AuthMode, string> = {
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-dialog-title"
          className={cn(
            "relative w-full max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-xl",
            "bg-background border rounded-2xl shadow-2xl",
            "p-5 sm:p-7 md:p-8 flex flex-col gap-5",
            "auth-modal-in",
          )}
        >
          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className={cn(
              "absolute right-4 top-4 rounded-md p-1",
              "text-muted-foreground hover:text-foreground",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* 제목 */}
          <h2
            id="auth-dialog-title"
            className="text-xl font-semibold leading-none"
          >
            {TAB_LABELS[mode]}
          </h2>

          {/* 탭 전환기 (role=tablist, web-design-guidelines: 접근성) */}
          <div
            role="tablist"
            aria-label="인증 방식"
            className="flex rounded-lg bg-muted p-1 gap-1"
          >
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
                  "transition-[background,color,box-shadow] duration-150",
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {TAB_LABELS[m]}
              </button>
            ))}
          </div>

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
