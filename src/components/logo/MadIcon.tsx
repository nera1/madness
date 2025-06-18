import React from "react";

export interface MadIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  bgColor?: string;
  fillColor?: string;
}

const MadIcon: React.FC<MadIconProps> = ({
  size = 16,
  bgColor = "rgb(0%,0%,0%)",
  fillColor = "rgb(100%,100%,100%)",
  width,
  height,
  ...props
}) => {
  const computedWidth = width ?? size;
  const computedHeight = height ?? (size * 10) / 16;

  return (
    <svg
      width={computedWidth}
      height={computedHeight}
      viewBox="0 0 16 10"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <g id="surface1">
        <rect
          x="0"
          y="0"
          width="16"
          height="10"
          fill={bgColor}
          fillOpacity="1"
          stroke="none"
        />
        <path
          stroke="none"
          fillRule="nonzero"
          fill={fillColor}
          fillOpacity="1"
          d="M 1.488281 1.265625 L 3.097656 1.265625 L 3.8125 6.613281 L 3.835938 6.613281 L 4.550781 1.265625 L 6.160156 1.265625 L 6.160156 8.734375 L 5.09375 8.734375 L 5.09375 3.078125 L 5.074219 3.078125 L 4.253906 8.734375 L 3.3125 8.734375 L 2.492188 3.078125 L 2.472656 3.078125 L 2.472656 8.734375 L 1.488281 8.734375 Z M 7.871094 1.265625 L 9.398438 1.265625 L 10.566406 8.734375 L 9.441406 8.734375 L 9.234375 7.25 L 9.234375 7.273438 L 7.953125 7.273438 L 7.75 8.738281 L 6.703125 8.738281 Z M 9.101562 6.257812 L 8.597656 2.566406 L 8.578125 2.566406 L 8.085938 6.257812 Z M 11.109375 1.265625 L 12.832031 1.265625 C 13.390625 1.265625 13.8125 1.421875 14.09375 1.734375 C 14.371094 2.046875 14.511719 2.507812 14.511719 3.113281 L 14.511719 6.890625 C 14.511719 7.496094 14.371094 7.953125 14.09375 8.265625 C 13.8125 8.578125 13.390625 8.734375 12.832031 8.734375 L 11.109375 8.734375 Z M 12.808594 7.667969 C 12.996094 7.667969 13.136719 7.613281 13.234375 7.5 C 13.335938 7.386719 13.382812 7.199219 13.382812 6.945312 L 13.382812 3.058594 C 13.382812 2.800781 13.335938 2.617188 13.234375 2.503906 C 13.136719 2.390625 12.996094 2.332031 12.808594 2.332031 L 12.234375 2.332031 L 12.234375 7.667969 Z M 12.808594 7.667969 "
        />
      </g>
    </svg>
  );
};

export default MadIcon;
