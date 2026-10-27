"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRegister, type RegisterQuery } from "@/lib/api";
import type { RegisterResponse } from "@/lib/types";

type Status = "loading" | "success" | "error";

export function useRegister(query: Omit<RegisterQuery, "signal">) {
  const [data, setData] = useState<RegisterResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);
  const silentRef = useRef(false);
  const { companyId, register, year, month, state } = query;

  useEffect(() => {
    const ctrl = new AbortController();
    const silent = silentRef.current;
    silentRef.current = false;
    if (!silent) setStatus("loading");
    getRegister({ companyId, register, year, month, state, signal: ctrl.signal })
      .then((res) => {
        setData(res);
        setStatus("success");
        setError(null);
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setError(e);
        setStatus("error");
      });
    return () => ctrl.abort();
  }, [companyId, register, year, month, state, nonce]);

  /** Refetch; `silent` keeps current data on screen (after a mutation). */
  const refetch = useCallback((silent = false) => {
    silentRef.current = silent;
    setNonce((n) => n + 1);
  }, []);

  return { data, status, error, refetch };
}
