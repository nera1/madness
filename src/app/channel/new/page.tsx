"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";

import { createChannel } from "@/lib/api/methods/post";
import { useRouter } from "next/navigation";
import { authCheck, refresh } from "@/lib/api";

import { Check, CircleX, House } from "lucide-react";

import styles from "@/styles/new-channel.module.scss";

interface ChannelFormState {
  [key: string]: string;
  name: string;
}

enum Status {
  idle,
  success,
  failed,
}

export default function NewChannel() {
  const [form, setForm] = useState<ChannelFormState>({ name: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>(Status.idle);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, name: value }));
    setStatus(Status.idle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    createChannel(form)
      .then(() => {
        setStatus(Status.success);
      })
      .catch(() => {
        refresh()
          .then(() => createChannel(form))
          .then(() => {
            setStatus(Status.success);
          })
          .catch(() => {
            setStatus(Status.failed);
          });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const sumbitButtonText = (status: Status) => {
    switch (status) {
      case Status.idle:
        return "Create Channel";
      case Status.success:
        return "Channel Created";
      case Status.failed:
        return "Create Failed";
      default:
        return "Create Channel";
    }
  };

  const sumbitButtonIcon = (status: Status) => {
    switch (status) {
      case Status.idle:
        return <></>;
      case Status.success:
        return <Check />;
      case Status.failed:
        return <CircleX />;
      default:
        return <></>;
    }
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
              disabled={!form.name || status !== Status.idle}
            >
              {isLoading ? <></> : sumbitButtonIcon(status)}
              {isLoading ? <Spinner size={16} /> : sumbitButtonText(status)}
            </Button>
          </form>
          {status === Status.success ? (
            <Button
              className="cursor-pointer border border-neutral-600 mt-2 text-neutral-100 hover:bg-neutral-600 hover:text-neutral-100 w-full"
              variant="ghost"
              onClick={() => {
                router.push("/");
              }}
            >
              <House />
              <span>Home</span>
            </Button>
          ) : (
            <></>
          )}
        </div>
      </main>
    </>
  );
}
