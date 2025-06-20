"use client";

import { ChangeEventHandler, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { signin } from "@/lib/api/methods/post";
import { authCheck } from "@/lib/api";

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
  const router = useRouter();
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

  const [isLoading, setIsLoading] = useState(false);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value } = e.target;
    setState((prev) => ({ ...prev, [id]: value }));

    setErrors((prev) => ({ ...prev, [id]: "" }));

    if (id === "email") {
      const isValidEmail = value.includes("@");
      setValid((prev) => ({ ...prev, email: isValidEmail }));
      if (!isValidEmail) {
        setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
      }
    }
    if (id === "password") {
      const isValidPassword = value.length >= 6;
      setValid((prev) => ({ ...prev, password: isValidPassword }));
      if (!isValidPassword) {
        setErrors((prev) => ({
          ...prev,
          password: "Password must be at least 6 characters",
        }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signin(state);
      router.back();
    } catch (err) {
      console.error(err);
      setValid({ email: false, password: false });
      setErrors({
        email: "Invalid email or password",
        password: "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            className="flex flex-col gap-y-3 py-8 w-full"
          >
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="Email"
              value={state.email}
              onChange={handleChange}
              maxLength={254}
              error={errors.email}
              isValid={valid.email}
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              placeholder="Password"
              value={state.password}
              onChange={handleChange}
              error={errors.password}
              isValid={valid.password}
            />

            <Button
              type="submit"
              className="cursor-pointer"
              disabled={!(valid.email && valid.password) || isLoading}
            >
              {isLoading ? <Spinner /> : "Sign in"}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
