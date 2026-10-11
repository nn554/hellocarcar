import type { DecisionAnswer, MarketCode } from "@hellocarcar/contracts";

export type DecisionProviderInput = {
  marketCode: MarketCode;
  locale: string;
  question: string;
  evidence: Array<{ id: string; title: string; content: string; sourceDate: Date }>;
};

export interface DecisionProvider {
  createBriefDecision(input: DecisionProviderInput): Promise<DecisionAnswer>;
}

export const DECISION_PROVIDER = Symbol("DECISION_PROVIDER");

export class UnconfiguredDecisionProvider implements DecisionProvider {
  async createBriefDecision(): Promise<DecisionAnswer> {
    throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  }
}
