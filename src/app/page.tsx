"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-center">LumosFund</h1>
        <p className="mt-3 text-xl text-center text-muted-foreground">
          AI驱动的量化交易平台
        </p>
        <p className="mt-2 text-center text-muted-foreground">
          正在跳转到仪表盘...
        </p>
      </div>
    </div>
  );
}
