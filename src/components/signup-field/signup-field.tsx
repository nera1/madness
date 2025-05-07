"use client";

import { ChangeEventHandler } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleCheck, CircleAlert } from "lucide-react";
import styles from "@/styles/signup.module.scss";

type SignupFieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string;
  isValid: boolean;
  maxLength?: number;
};

export default function SignupField({
  id,
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error = "",
  isValid,
  maxLength,
}: SignupFieldProps) {
  const showIcon = value.length > 0;
  return (
    <div
      className={`flex flex-col gap-2 ${
        value ? (isValid ? styles["valid"] : styles["invalid"]) : ""
      }`}
    >
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center relative">
        <Input
          type={type}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
        />
        {showIcon &&
          (isValid ? (
            <CircleCheck size={18} className="absolute right-0 mr-2" />
          ) : (
            <CircleAlert size={18} className="absolute right-0 mr-2" />
          ))}
      </div>
      <span className="text-sm text-muted-foreground">{error}</span>
    </div>
  );
}
