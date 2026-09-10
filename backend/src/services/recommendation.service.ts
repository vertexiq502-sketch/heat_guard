import { WorkerType } from '../types/user';
import { RiskLevel } from '../types/site';

export class RecommendationService {
  static getRecommendation(riskLevel: RiskLevel, workerType: string) {
    if (riskLevel === 'red') {
      return {
        workStatus: "STOP WORK",
        restInstruction: "Rest immediately in active cooling/shade.",
        hydrationInstruction: "Drink 1 liter of cool water per hour.",
        additionalGuidance: workerType === 'construction' ? "Remove heavy PPE immediately." : "Seek AC environment immediately."
      };
    }
    if (riskLevel === 'orange') {
      return {
        workStatus: "MODIFY WORK",
        restInstruction: "45 mins work / 15 mins rest in shade.",
        hydrationInstruction: "Drink 750ml water per hour.",
        additionalGuidance: "Buddy system mandatory. Monitor for symptoms."
      };
    }
    if (riskLevel === 'yellow') {
      return {
        workStatus: "CAUTION",
        restInstruction: "Take breaks when fatigued.",
        hydrationInstruction: "Drink 500ml water per hour.",
        additionalGuidance: "Wear light clothing."
      };
    }
    return {
      workStatus: "NORMAL",
      restInstruction: "Standard breaks.",
      hydrationInstruction: "Drink water when thirsty.",
      additionalGuidance: "Normal operations."
    };
  }
}