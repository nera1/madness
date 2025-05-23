import { LogIn } from "lucide-react";

import styles from "@/styles/signup.module.scss";
import style from "@/styles/signup-success.module.scss";
import { Button } from "@/components/ui/button";

export default function SignupSuccess() {
  return (
    <>
      <main
        className={`${styles.signup} ${style["signup-success"]} flex justify-center box-border`}
      >
        <div className="mt-32 w-100">
          <h2 className="scroll-m-20 text-4xl font-semibold tracking-tight flex items-center gap-x-2">
            Success
          </h2>
          <p className="text-md text-muted-foreground">
            Account created! Log in now
          </p>
          <div className="py-3 flex flex-col gap-y-2">
            <Button className="w-100 cursor-pointer">
              <LogIn /> Login
            </Button>
            <Button
              className="w-100 cursor-pointer border border-neutral-500 text-neutral-500"
              variant="ghost"
            >
              <LogIn /> home
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
