"use client";
import dynamic from "next/dynamic";

const BumoAnsim = dynamic(() => import("@/components/BumoAnsim"), { ssr: false });

export default function Home() {
  return <BumoAnsim />;
}
