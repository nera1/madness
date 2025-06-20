"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, House } from "lucide-react";

import { Button } from "@/components/ui/button";
import TextLogo from "@/components/logo/TextLogo";
import Link from "next/link";

import { authCheck } from "@/lib/api";

import styles from "@/styles/signup.module.scss";
import style from "@/styles/signup-success.module.scss";

export default function SignupSuccess() {
  const router = useRouter();
  useEffect(() => {
    authCheck()
      .then(() => {
        router.push("/");
      })
      .catch(() => {});
  }, []);
  return (
    <>
      <main
        className={`${styles.signup} ${style["signup-success"]} flex justify-center box-border`}
      >
        <div className={`${styles["container"]} mt-32 w-full`}>
          <div className="flex justify-center py-10 mb-10 w-full">
            <TextLogo width={164} fill="#fff" />
          </div>
          <h2 className="scroll-m-20 text-4xl font-semibold tracking-tight flex items-center gap-x-2">
            Success
          </h2>
          <p className="text-md text-muted-foreground">
            Account created! Log in now
          </p>
          <div className="py-3 flex flex-col gap-y-2">
            <Link href={"/signin"} className="bg-transparent">
              <Button className="w-full cursor-pointer">
                <LogIn /> Login
              </Button>
            </Link>
            <Link href={"/"} className="bg-transparent">
              <Button
                className="w-full cursor-pointer border border-neutral-600 text-neutral-100 hover:bg-neutral-600 hover:text-neutral-100"
                variant="ghost"
              >
                <House />
                <span>Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
