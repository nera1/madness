import Header from "@/components/header/header";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";

import styles from "@/styles/signup.module.scss";

export default function Signup() {
  return (
    <>
      <Header logoCenter />
      <main className={`${styles["signup"]} flex justify-center box-border`}>
        <div
          className={`${styles["container"]} flex flex-col align-center pt-5`}
        >
          <h1 className="text-3xl font-extrabold tracking-tight">Sign up</h1>
          <form className="flex justify-center flex-col align-center gap-y-5 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input type="text" id="nicname" placeholder="Nickname" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input type="password" id="password" placeholder="Password" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                type="password"
                id="confirm-password"
                placeholder="Confirm password"
              />
            </div>
            <Button type="submit" className="cursor-pointer">
              Sign up
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
