import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GoTrip PRD｜AI 个性化旅行规划产品",
  description: "面向 AI 产品经理岗位的 GoTrip 产品案例：问题定义、AI 方案、评测体系、Bad Case 与产品迭代。",
};

export default function PrdLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
