import { WorkerType } from '../types/user';
import { RiskLevel } from '../types/site';

export class RecommendationService {
  static getRecommendation(riskLevel: RiskLevel, workerType: string) {
    if (riskLevel === 'red') {
      return {
        workStatus: "STOP WORK",
        restInstruction: "Rest immediately in active cooling/shade.",
        hydrationInstruction: "Drink 1 liter of cool water per hour.",
        additionalGuidance: workerType === 'construction' ? "Remove heavy PPE immediately." : "Seek AC environment immediately.",
        wellnessTips: [
          "Drink 1 liter of cool water per hour with ORS electrolytes. Do not wait until thirsty.",
          "Mandatory work stoppage: Rest immediately in shaded cooling canopy or air-conditioned shelter.",
          "Loosen heavy PPE, wet your skin/cloth on neck, and use active fan cooling.",
          "Watch for heat stroke signs (confusion, dizziness, nausea, no sweating); notify supervisor immediately."
        ]
      };
    }
    if (riskLevel === 'orange') {
      return {
        workStatus: "MODIFY WORK",
        restInstruction: "45 mins work / 15 mins rest in shade.",
        hydrationInstruction: "Drink 750ml water per hour.",
        additionalGuidance: "Buddy system mandatory. Monitor for symptoms.",
        wellnessTips: [
          "Drink at least 750ml of cool water or electrolyte solution every hour.",
          "Take mandatory 15-minute rest breaks in shade for every 45 minutes of work.",
          "Wear lightweight, breathable clothing and UV-protective headgear.",
          "Check in with your site buddy every 30 minutes to ensure no heat exhaustion."
        ]
      };
    }
    if (riskLevel === 'yellow') {
      return {
        workStatus: "CAUTION",
        restInstruction: "Take breaks when fatigued.",
        hydrationInstruction: "Drink 500ml water per hour.",
        additionalGuidance: "Wear light clothing.",
        wellnessTips: [
          "Drink 2 glasses (500ml) of water every hour to prevent dehydration.",
          "Take regular 10-minute rest breaks in shaded areas when feeling fatigued.",
          "Wear loose, light-colored cotton garments and avoid peak direct sunlight.",
          "Be aware of early fatigue symptoms and keep hydration packs nearby."
        ]
      };
    }
    return {
      workStatus: "NORMAL",
      restInstruction: "Standard breaks.",
      hydrationInstruction: "Drink water when thirsty.",
      additionalGuidance: "Normal operations.",
      wellnessTips: [
        "Drink water regularly throughout your work shift to maintain energy.",
        "Take scheduled shift breaks in comfortable, well-ventilated areas.",
        "Keep protective sun gear and hydration bottles within easy reach.",
        "Stay alert to changing midday weather conditions."
      ]
    };
  }
}