"use client";

import { AppProgressBar } from "next-nprogress-bar";

export default function ProgressBar() {
  return (
    <AppProgressBar
      height="5px"
      color="#6366f1"
      options={{ showSpinner: false, trickleSpeed: 150 }}
      style="box-shadow: 0 0 10px #6366f1, 0 0 5px #6366f1;"
      shallowRouting
    />
  );
}
