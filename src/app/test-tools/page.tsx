import { Metadata } from "next";
import { TestToolsClient } from "./client";

export const metadata: Metadata = {
  title: "财务分析工具测试",
  description: "测试创新评估和收入增长分析工具",
};

export default function TestToolsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">财务分析工具测试</h1>
          <p className="text-muted-foreground">
            测试创新能力评估和收入增长分析等财务分析工具功能
          </p>
        </div>
        <TestToolsClient />
      </div>
    </div>
  );
} 