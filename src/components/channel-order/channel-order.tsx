import { FunctionComponent } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ClockArrowDown, ClockArrowUpIcon, UsersRound } from "lucide-react";

import styles from "@/styles/channel-list-order.module.scss";

export type OrderType = "desc" | "asc" | "participants";

interface ChannelListOrderProps {
  value: OrderType;
  onChange: (value: OrderType) => void;
}

const ChannelListOrder: FunctionComponent<ChannelListOrderProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as OrderType)}
      defaultValue="desc"
    >
      <SelectTrigger className={styles["channel-list-order-trigger"]}>
        <SelectValue placeholder="Order" />
      </SelectTrigger>
      <SelectContent
        align="end"
        className={`${styles["channel-list-order"]} bg-transparent`}
      >
        <SelectGroup className={styles["select-group"]}>
          <SelectLabel>Order</SelectLabel>
          <SelectItem value="desc">
            <ClockArrowDown />
            Newest
          </SelectItem>
          <SelectItem value="asc">
            <ClockArrowUpIcon />
            Oldest
          </SelectItem>
          <SelectItem value="participants" disabled>
            <UsersRound />
            Participants
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ChannelListOrder;
