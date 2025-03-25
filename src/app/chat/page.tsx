"use client";

export default function Chat() {
  function handler() {
    fetch("https://port-0-madness-m7n2xo5qde508f14.sel4.cloudtype.app")
      .then((result) => result.json())
      .then((data) => console.log(data));
  }
  return (
    <div>
      <button onClick={handler}>TEST</button>
    </div>
  );
}
