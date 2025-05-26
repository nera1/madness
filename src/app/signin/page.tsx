"use client";

import { debounce } from "lodash";
import Header from "@/components/header/header";
import SignupField from "@/components/signup-field/signup-field";
import {
  ChangeEventHandler,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";

import { checkEmailDuplicate, checkNicknameDuplicate } from "@/lib/api";

import styles from "@/styles/signin.module.scss";

type SigninState = {
  email: string;
  password: string;
};

type ValidState = {
  email: boolean;
  password: boolean;
};

export default function Signin() {
  const [state, setState] = useState<SigninState>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<SigninState>({
    email: "",
    password: "",
  });

  const [valid, setValid] = useState<ValidState>({
    email: false,
    password: false,
  });

  const handleSubmit = (e: FormEvent) => {};

  return (
    <>
      <Header logoCenter />
      <main className={`${styles.signin} flex justify-center box-border`}>
        <div className={`${styles.container} flex flex-col pt-12`}>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <span className="text-base text-muted-foreground">
            Enter your email and password to dive back in.
          </span>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-y-3 py-8 w-full max-w-md"
          >
            <SignupField
              id="email"
              label="Email"
              type="email"
              placeholder="Email"
              value={state.email}
              onChange={() => {}}
              maxLength={254}
              error={errors.email}
              isValid={valid.email}
            />
            <SignupField
              id="password"
              label="Password"
              type="password"
              placeholder="Password"
              value={state.password}
              onChange={() => {}}
              error={errors.password}
              isValid={valid.password}
            />

            <Button
              type="submit"
              className="cursor-pointer"
              disabled={!(valid.email && valid.password)}
            >
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
