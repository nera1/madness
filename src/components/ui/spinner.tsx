import React from "react";
import { LoaderCircle } from "lucide-react";

export interface SpinnerProps
  extends React.ComponentProps<typeof LoaderCircle> {
  size?: number | string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 24,
  className = "",
  ...props
}) => (
  <LoaderCircle
    size={size}
    className={`animate-spin ${className}`}
    {...props}
  />
);

export default Spinner;
