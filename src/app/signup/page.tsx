"use client";

import Header from "@/components/header/header";
import SignupField from "@/components/signup-field/signup-field";
import { ChangeEventHandler, FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "@/styles/signup.module.scss";

type SignupState = {
  email: string;
  nickname: string;
  password: string;
  confirmPassword: string;
};

type ValidState = {
  email: boolean;
  nickname: boolean;
  password: boolean;
  confirmPassword: boolean;
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

  const [valid, setValid] = useState<ValidState>({
    email: false,
    nickname: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (state.password != state.confirmPassword) {
      setValid((prev) => ({ ...prev, confirmPassword: false }));
      setErrors((s) => ({
        ...s,
        confirmPassword: "비밀번호가 일치하지 않습니다",
      }));
    } else {
      setValid((prev) => ({ ...prev, confirmPassword: true }));
      setErrors((s) => ({
        ...s,
        confirmPassword: "",
      }));
    }
  }, [state.confirmPassword, state.password, setValid]);

  const emailRegex =
    /^(?=.{5,254}$)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

  const passwordRegex =
    /^(?=.{8,32}$)(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/;

  const nicknameRegex = /^(?=.{2,12}$)[A-Za-z가-힣0-9_-]+$/;

  const onChangeEmail: ChangeEventHandler<HTMLInputElement> = (e) => {
    const email = e.target.value;
    const isValid = emailRegex.test(email);
    setState((s) => ({ ...s, email }));
    setErrors((s) => ({
      ...s,
      email: isValid ? "" : "유효하지 않은 이메일 형식입니다",
    }));
    setValid((v) => ({ ...v, email: isValid }));
  };

  const onChangeNickname: ChangeEventHandler<HTMLInputElement> = (e) => {
    const nickname = e.target.value;
    const isValid = nicknameRegex.test(nickname);
    setState((s) => ({ ...s, nickname }));
    setErrors((s) => ({
      ...s,
      nickname: isValid
        ? ""
        : "유효하지 않은 닉네임입니다. 2자 이상 16자 이하의 영문, 한글, 숫자, '-', '_'만 사용할 수 있습니다",
    }));
    setValid((v) => ({ ...v, nickname: isValid }));
  };

  const onChangePassword: ChangeEventHandler<HTMLInputElement> = (e) => {
    const password = e.target.value;
    const isValid = passwordRegex.test(password);
    setState((s) => ({ ...s, password }));
    setErrors((s) => ({
      ...s,
      password: isValid
        ? ""
        : "최소 8자 이상이어야 하며, 문자, 숫자, 특수문자를 포함해야 합니다",
    }));
    setValid((v) => ({
      ...v,
      password: isValid,
      confirmPassword: state.confirmPassword === password,
    }));
  };

  const onChangeConfirmPassword: ChangeEventHandler<HTMLInputElement> = (e) => {
    const confirmPassword = e.target.value;
    const isValid = confirmPassword === state.password;
    setState((s) => ({ ...s, confirmPassword }));
    setErrors((s) => ({
      ...s,
      confirmPassword: isValid ? "" : "비밀번호가 일치하지 않습니다",
    }));
    setValid((v) => ({ ...v, confirmPassword: isValid }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      valid.email &&
      valid.nickname &&
      valid.password &&
      valid.confirmPassword
    ) {
      console.log("Form Submitted:", state);
    } else {
      console.log("Validation failed", valid);
    }
  };

  return (
    <>
      <Header logoCenter />
      <main className={`${styles.signup} flex justify-center box-border`}>
        <div className={`${styles.container} flex flex-col pt-12`}>
          <h1 className="text-3xl font-semibold tracking-tight">
            Create account
          </h1>
          <span className="text-base text-muted-foreground">
            Create your account and get started.
          </span>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-y-3 py-8 w-full max-w-md"
          >
            <SignupField
              id="email"
              label="Email"
              type="email"
              placeholder="user@example.com 형태로 입력하세요"
              value={state.email}
              onChange={onChangeEmail}
              maxLength={64}
              error={state.email ? errors.email : ""}
              isValid={valid.email}
            />
            <SignupField
              id="nickname"
              label="Nickname"
              placeholder="닉네임을 입력하세요"
              value={state.nickname}
              onChange={onChangeNickname}
              error={errors.nickname}
              isValid={valid.nickname}
            />
            <SignupField
              id="password"
              label="Password"
              type="password"
              placeholder="최소 8자 이상, 문자+숫자+특수문자 포함"
              value={state.password}
              onChange={onChangePassword}
              error={errors.password}
              isValid={valid.password}
            />
            <SignupField
              id="confirm-password"
              label="Confirm password"
              type="password"
              placeholder="비밀번호를 다시 한 번 입력하세요"
              value={state.confirmPassword}
              onChange={onChangeConfirmPassword}
              error={errors.confirmPassword}
              isValid={valid.confirmPassword}
            />
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={
                !(
                  valid.email &&
                  valid.nickname &&
                  valid.password &&
                  valid.confirmPassword
                )
              }
            >
              Create account
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
