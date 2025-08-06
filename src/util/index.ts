export function formatDotDateTime12Hour(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const pad = (n: number): string => n.toString().padStart(2, "0");

  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  let hours = date.getHours();
  const minutes = pad(date.getMinutes());

  const period = hours < 12 ? "am" : "pm";

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;

  const formatted = `${month}.${day} ${pad(hours)}:${minutes} ${period}`;
  return formatted;
}

export function secureRandomString(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

// HSL → HEX 변환 헬퍼
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateHexColor(
  nicknameSeed: string,
  clientSeed: string
): string {
  const hash = fnv1aHash(nicknameSeed + clientSeed);
  const hue = hash % 360;
  const saturation = 100;
  const lightness = 65;
  return hslToHex(hue, saturation, lightness);
}

export function truncateWithEllipsis(
  text: string = "",
  maxLength: number
): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
}
