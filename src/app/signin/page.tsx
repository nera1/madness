"use client";

import { ChangeEventHandler, FormEvent, useState } from "react";
import Header from "@/components/header/header";
import SignupField from "@/components/signup-field/signup-field";
import { Button } from "@/components/ui/button";

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

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const { id, value } = e.target;
    setState((prev) => ({ ...prev, [id]: value }));

    // Clear any previous error for this field
    setErrors((prev) => ({ ...prev, [id]: "" }));

    if (id === "email") {
      setValid((prev) => ({ ...prev, email: value.includes("@") }));
      if (!value.includes("@")) {
        setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
      }
    }
    if (id === "password") {
      setValid((prev) => ({ ...prev, password: value.length >= 6 }));
      if (value.length < 6) {
        setErrors((prev) => ({
          ...prev,
          password: "Password must be at least 6 characters",
        }));
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Signing in with:", state);
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
            className="flex flex-col gap-y-3 py-8 w-full max-w-md"
          >
            <SignupField
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
            <SignupField
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
