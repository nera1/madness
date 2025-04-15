import Header from "@/components/header/header";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import styles from "@/styles/signup.module.scss";

export default function Signup() {
  return (
    <>
      <Header logoCenter />
      <main className={`${styles["signup"]} flex justify-center`}>
        <div className={`${styles["container"]} pt-3 text-white`}>
          <h1 className="text-2xl font-extrabold tracking-tight">Sign up</h1>
          <form>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Email" />
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
