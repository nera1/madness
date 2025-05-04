"use client";

import Header from "@/components/header/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import styles from "@/styles/signup.module.scss";
import { ChangeEventHandler, useState } from "react";

type SignupState = {
  email: string;
  nickname: string;
  password: string;
  confirmPassword: string;
};

export default function Signup() {
  const [state, setState] = useState<SignupState>({
    email: "",
    nickname: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<SignupState>({
    email: "",
    nickname: "",
    password: "",
    confirmPassword: "",
  });

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  const onChangeEmail: ChangeEventHandler<HTMLInputElement> = (event) => {
    const email = event.target.value;
    setState({ ...state, email });
    setErrors({
      ...errors,
      email: emailRegex.test(email) ? "" : "Invalid email format",
    });
  };

  const onChangeNickname: ChangeEventHandler<HTMLInputElement> = (event) => {
    setState({ ...state, nickname: event.target.value });
  };

  const onChangePassword: ChangeEventHandler<HTMLInputElement> = (event) => {
    const password = event.target.value;
    setState({ ...state, password });
    setErrors({
      ...errors,
      password: passwordRegex.test(password)
        ? ""
        : "Password must be at least 8 characters, include a letter, a number, and a special character.",
    });
  };

  const onChangeConfirmPassword: ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const confirmPassword = event.target.value;
    setState({ ...state, confirmPassword });
    setErrors({
      ...errors,
      confirmPassword:
        confirmPassword === state.password ? "" : "Passwords do not match",
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // 추가적인 유효성 검사 및 폼 제출 처리
    if (
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword &&
      state.email &&
      state.password &&
      state.confirmPassword
    ) {
      // 폼 제출 로직
      console.log("Form Submitted:", state);
    }
  };

  return (
    <>
      <Header logoCenter />
      <main className={`${styles["signup"]} flex justify-center box-border`}>
        <div
          className={`${styles["container"]} flex flex-col align-center pt-12`}
        >
          <h1 className="text-3xl font-semibold tracking-tight">
            Create account
          </h1>
          <p className="text-base text-muted-foreground">
            Create your account and get started.
          </p>
          <form
            className="flex justify-center flex-col align-center gap-y-5 py-8"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="Enter a valid email (e.g., user@example.com)"
                value={state.email}
                onChange={onChangeEmail}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                type="text"
                id="nickname"
                placeholder="Enter a nickname"
                value={state.nickname}
                onChange={onChangeNickname}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="At least 8 characters, with letters, numbers, and symbols"
                value={state.password}
                onChange={onChangePassword}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                type="password"
                id="confirm-password"
                placeholder="Confirm your password"
                value={state.confirmPassword}
                onChange={onChangeConfirmPassword}
              />
            </div>
            <Button type="submit" className="cursor-pointer">
              Create account
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
