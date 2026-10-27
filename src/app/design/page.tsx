import type { Metadata } from "next";
import { Specimen } from "./specimen";

export const metadata: Metadata = { title: "System projektowy · Saldo" };

export default function DesignPage() {
  return <Specimen />;
}
