"use client";

import Header from "@/components/header/header";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";

import styles from "@/styles/signup.module.scss";
import { useState } from "react";

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
          <form className="flex justify-center flex-col align-center gap-y-5 py-8">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="Email"
                value={state.email}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                type="text"
                id="nickname"
                placeholder="Nickname"
                value={state.nickname}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="Password"
                value={state.password}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                type="password"
                id="confirm-password"
                placeholder="Confirm password"
                value={state.confirmPassword}
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
