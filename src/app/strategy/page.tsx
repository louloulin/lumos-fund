import StrategyRecommendation from "@/components/strategy/StrategyRecommendation";

export const metadata = {
  title: "AI策略推荐 - LumosFund",
  description: "基于市场状况、风险承受能力和投资期限，为您推荐个性化的投资策略组合",
};

export default function StrategyPage() {
  return <StrategyRecommendation />;
} 