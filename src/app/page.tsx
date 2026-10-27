import { Suspense } from "react";
import { RegisterApp } from "@/components/register/register-app";

export default function Page() {
  return (
    <Suspense>
      <RegisterApp />
    </Suspense>
  );
}
