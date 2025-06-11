"use client";

import { useState } from "react";
import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";

import { Button } from "@/components/ui/button";
// import Spinner from "@/components/ui/spinner";

import styles from "@/styles/new-channel.module.scss";

interface ChannelFormState {
  [key: string]: string;
  name: string;
}

export default function NewChannel() {
  const [form, setForm] = useState<ChannelFormState>({ name: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, name: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <Header fixed border menu />
      <main
        className={`${styles["new-channel"]} flex justify-center box-border`}
      >
        <div className={styles.container}>
          <h1 className="text-3xl font-semibold tracking-tight">New Channel</h1>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-y-4">
            <InputField
              id="Name"
              label="Channel Name"
              type="text"
              placeholder="채널 이름을 입력해 주세요"
              value={form.name}
              onChange={handleChange}
              maxLength={254}
              isValid={true}
            />
            <Button
              type="submit"
              className="flex items-center justify-center cursor-pointer"
              disabled={!form.name}
            >
              {false}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
