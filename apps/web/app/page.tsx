import type { Metadata } from "next";
import { PublicHomepage } from "@/components/public-homepage";

export const metadata: Metadata = {
  title: "HelloCarCar · 汽车出口，从容一点",
  description: "你的汽车出口 AI 工作伙伴。了解车型报价、海运运价、车型配置与采购报告，在一个工作区里理清采购决策。"
};

export default function Home() {
  return <PublicHomepage />;
}
