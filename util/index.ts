export function formatDotDateTime12Hour(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const pad = (n: number): string => n.toString().padStart(2, "0");

  //const year = date.getFullYear();
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
