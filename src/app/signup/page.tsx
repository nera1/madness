"use client";

import { debounce, omit } from "lodash";
import Header from "@/components/header/header";
import SignupField from "@/components/signup-field/signup-field";
import {
  ChangeEventHandler,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";

import { checkEmailDuplicate, checkNicknameDuplicate } from "@/lib/api";
import { signup } from "@/lib/api/methods/post";

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
  const router = useRouter();
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

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.password !== state.confirmPassword) {
      setValid((v) => ({ ...v, confirmPassword: false }));
      setErrors((e) => ({
        ...e,
        confirmPassword: "비밀번호가 일치하지 않습니다",
      }));
    } else {
      setValid((v) => ({ ...v, confirmPassword: true }));
      setErrors((e) => ({ ...e, confirmPassword: "" }));
    }
  }, [state.password, state.confirmPassword]);

  const emailRegex =
    /^(?=.{5,254}$)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
  const nicknameRegex = /^(?=.{2,12}$)[A-Za-z가-힣0-9_-]+$/;
  const passwordRegex =
    /^(?=.{8,32}$)(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/;

  const debouncedCheckEmail = useMemo(
    () =>
      debounce(async (email: string) => {
        try {
          const res = await checkEmailDuplicate(email);
          if (res.data.isDuplicate) {
            setErrors((e) => ({ ...e, email: "이미 사용 중인 이메일입니다" }));
            setValid((v) => ({ ...v, email: false }));
          } else {
            setErrors((e) => ({ ...e, email: "" }));
            setValid((v) => ({ ...v, email: true }));
          }
        } catch (err) {
          console.error(err);
        }
      }, 500),
    []
  );

  const debouncedCheckNickname = useMemo(
    () =>
      debounce(async (nickname: string) => {
        try {
          const res = await checkNicknameDuplicate(nickname);
          if (res.data.isDuplicate) {
            setErrors((e) => ({
              ...e,
              nickname: "이미 사용 중인 닉네임입니다",
            }));
            setValid((v) => ({ ...v, nickname: false }));
          } else {
            setErrors((e) => ({ ...e, nickname: "" }));
            setValid((v) => ({ ...v, nickname: true }));
          }
        } catch (err) {
          console.error(err);
        }
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedCheckEmail.cancel();
      debouncedCheckNickname.cancel();
    };
  }, [debouncedCheckEmail, debouncedCheckNickname]);

  const onChangeEmail: ChangeEventHandler<HTMLInputElement> = (e) => {
    const email = e.target.value;
    setState((s) => ({ ...s, email }));

    if (!emailRegex.test(email)) {
      setErrors((e) => ({ ...e, email: "유효하지 않은 이메일 형식입니다" }));
      setValid((v) => ({ ...v, email: false }));
    } else {
      setErrors((e) => ({ ...e, email: "" }));
      setValid((v) => ({ ...v, email: false }));
      debouncedCheckEmail(email);
    }
  };

  const onChangeNickname: ChangeEventHandler<HTMLInputElement> = (e) => {
    const nickname = e.target.value;
    setState((s) => ({ ...s, nickname }));

    if (!nicknameRegex.test(nickname)) {
      setErrors((e) => ({
        ...e,
        nickname:
          "유효하지 않은 닉네임입니다. 2자 이상 12자 이하의 영문, 한글, 숫자, '-', '_'만 사용할 수 있습니다",
      }));
      setValid((v) => ({ ...v, nickname: false }));
    } else {
      setErrors((e) => ({ ...e, nickname: "" }));
      setValid((v) => ({ ...v, nickname: false }));
      debouncedCheckNickname(nickname);
    }
  };

  const onChangePassword: ChangeEventHandler<HTMLInputElement> = (e) => {
    const password = e.target.value;
    const isValid = passwordRegex.test(password);
    setState((s) => ({ ...s, password }));
    setErrors((e) => ({
      ...e,
      password: isValid
        ? ""
        : "최소 8자 이상이어야 하며, 문자, 숫자, 특수문자를 포함해야 합니다",
    }));
    setValid((v) => ({ ...v, password: isValid }));
  };

  const onChangeConfirmPassword: ChangeEventHandler<HTMLInputElement> = (e) => {
    const confirmPassword = e.target.value;
    setState((s) => ({ ...s, confirmPassword }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      valid.email &&
      valid.nickname &&
      valid.password &&
      valid.confirmPassword
    ) {
      const payload = omit(state, ["confirmPassword"]);
      setIsLoading(true);
      signup(payload)
        .then(() => {
          router.push("/signup/success");
        })
        .catch((error) => {
          console.error(error);
          setValid({
            email: false,
            nickname: false,
            password: false,
            confirmPassword: false,
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      console.log("Validation failed", valid, errors);
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
              maxLength={254}
              error={errors.email}
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
              className="flex items-center justify-center cursor-pointer"
              disabled={
                isLoading ||
                !(
                  valid.email &&
                  valid.nickname &&
                  valid.password &&
                  valid.confirmPassword
                )
              }
            >
              {isLoading ? <Spinner size={16} /> : "Create account"}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
