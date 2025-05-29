import { LogIn, House } from "lucide-react";

import { Button } from "@/components/ui/button";
import MadIcon from "@/components/logo/MadIcon";
import Link from "next/link";

import styles from "@/styles/signup.module.scss";
import style from "@/styles/signup-success.module.scss";

export default function SignupSuccess() {
  return (
    <>
      <main
        className={`${styles.signup} ${style["signup-success"]} flex justify-center box-border`}
      >
        <div className="mt-32 w-100">
          <div className="flex justify-center py-10">
            <MadIcon size={128} className="border-4 border-neutral-50" />
          </div>
          <h2 className="scroll-m-20 text-4xl font-semibold tracking-tight flex items-center gap-x-2">
            Success
          </h2>
          <p className="text-md text-muted-foreground">
            Account created! Log in now
          </p>
          <div className="py-3 flex flex-col gap-y-2">
            <Link href={"/signin"} className="bg-transparent">
              <Button className="w-100 cursor-pointer">
                <LogIn /> Login
              </Button>
            </Link>
            <Link href={"/"} className="bg-transparent">
              <Button
                className="w-100 cursor-pointer border border-neutral-600 text-neutral-100 hover:bg-neutral-600 hover:text-neutral-100"
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
