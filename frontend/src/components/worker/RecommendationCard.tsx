import { useLocalization } from '../../hooks/useLocalization';
import { HeartPulse } from 'lucide-react';

interface RecommendationCardProps {
  recommendation?: {
    workStatus?: string;
    restInstruction?: string;
    hydrationInstruction?: string;
    additionalGuidance?: string;
    wellnessTips?: string[];
  } | null;
  riskLevel: string;
}

export const RecommendationCard = ({ recommendation, riskLevel }: RecommendationCardProps) => {
  const { t, language } = useLocalization();

  if (!recommendation) return null;

  const isHighRisk = riskLevel === 'orange' || riskLevel === 'red';

  // 4 Core Wellness Points localized for worker language (te, hi, en)
  const wellnessPoints =
    language === 'te'
      ? [
          {
            icon: '💧',
            title: 'నీరు & ORS పుష్కలంగా త్రాగండి',
            desc: 'ప్రతి 30-45 నిమిషాలకు కనీసం 2 గ్లాసుల చల్లని నీరు లేదా ORS ద్రావణం త్రాగండి. దాహం వేసేవరకు వేచి ఉండకండి.'
          },
          {
            icon: '⏱️',
            title: 'నీడలో తప్పనిసరి విశ్రాంతి తీసుకోండి',
            desc: 'ప్రతి గంటకు నీడ ఉన్న కూలింగ్ షెల్టర్‌లో 10-15 నిమిషాలు విశ్రాంతి తీసుకోండి. మధ్యాహ్న ఎండలో నేరుగా నిలబడవద్దు.'
          },
          {
            icon: '👕',
            title: 'తేలికపాటి బట్టలు & తలకు రక్షణ',
            desc: 'వదులైన, లేత రంగు కాటన్ దుస్తులు ధరించండి. తలకు టోపీ లేదా తడి గుడ్డను కప్పుకోండి.'
          },
          {
            icon: '🩺',
            title: 'ఆరోగ్య లక్షణాలను గమనించండి',
            desc: 'కళ్ళు తిరగడం, అధిక అలసట, లేదా కండరాల నొప్పులు అనిపిస్తే వెంటనే పని ఆపి సైట్ సూపర్‌వైజర్‌కు తెలపండి.'
          }
        ]
      : language === 'hi'
      ? [
          {
            icon: '💧',
            title: 'पानी और ओआरएस भरपूर पिएं',
            desc: 'हर 30-45 मिनट में कम से कम 2 गिलास ठंडा पानी या ओआरएस घोल पिएं। प्यास लगने का इंतज़ार न करें।'
          },
          {
            icon: '⏱️',
            title: 'छाया में नियमित विश्राम लें',
            desc: 'हर घंटे में छायादार कूलिंग शेल्टर में अनिवार्य रूप से 10-15 मिनट का ब्रेक लें। सीधी धूप से बचें।'
          },
          {
            icon: '👕',
            title: 'हल्के कपड़े और सिर को ढकें',
            desc: 'ढीले, हल्के रंग के सूती कपड़े पहनें और सिर को टोपी या गीले कपड़े से ढककर रखें।'
          },
          {
            icon: '🩺',
            title: 'स्वास्थ्य लक्षणों पर नजर रखें',
            desc: 'चक्कर, अत्यधिक थकान या ऐंठन महसूस होने पर तुरंत काम रोकें और सुपरवाइजर को सूचित करें।'
          }
        ]
      : [
          {
            icon: '💧',
            title: 'Drink Water & Hydrate Frequently',
            desc: 'Drink at least 2 glasses of cool water or ORS every 30-45 minutes. Do not wait until you feel thirsty.'
          },
          {
            icon: '⏱️',
            title: 'Take Scheduled Rest Breaks',
            desc: 'Take mandatory 10-15 minute rest breaks in shaded, well-ventilated cooling canopies every hour.'
          },
          {
            icon: '👕',
            title: 'Wear Light & Breathable Clothing',
            desc: 'Use loose, light-colored cotton clothing and protect your head with a hat or wet cooling towel.'
          },
          {
            icon: '🩺',
            title: 'Monitor Heat Stress Symptoms',
            desc: 'If experiencing dizziness, nausea, rapid pulse, or cramps, stop immediately and alert your site supervisor.'
          }
        ];

  return (
    <div
      className={`p-5 rounded-2xl border shadow-sm h-full flex flex-col justify-between space-y-4 ${
        isHighRisk ? 'bg-red-50/60 border-red-200' : 'bg-blue-50/60 border-blue-200'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isHighRisk ? 'text-red-900' : 'text-blue-950'
            }`}
          >
            <HeartPulse className={`w-4 h-4 ${isHighRisk ? 'text-red-600' : 'text-blue-600'}`} />
            {t('recommendations_title')} & Wellness
          </h3>
          <span
            className={`text-2xs font-semibold px-2 py-0.5 rounded ${
              isHighRisk ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isHighRisk ? 'High Heat Protocol' : 'Standard Care'}
          </span>
        </div>

        {/* Primary Operational Directive */}
        <div className="space-y-2 mb-3">
          {recommendation.workStatus && (
            <div className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-gray-100 shadow-xs">
              <span className="text-base">👷</span>
              <div>
                <p className="text-2xs font-bold text-gray-500 uppercase tracking-wider">Work Status</p>
                <p className={`text-xs font-bold ${isHighRisk ? 'text-red-900' : 'text-blue-900'}`}>
                  {recommendation.workStatus}
                </p>
              </div>
            </div>
          )}

          {recommendation.hydrationInstruction && (
            <div className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-gray-100 shadow-xs">
              <span className="text-base">💧</span>
              <div>
                <p className="text-2xs font-bold text-gray-500 uppercase tracking-wider">Hydration Target</p>
                <p className="text-xs font-semibold text-gray-800">
                  {recommendation.hydrationInstruction}
                </p>
              </div>
            </div>
          )}

          {recommendation.restInstruction && (
            <div className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-gray-100 shadow-xs">
              <span className="text-base">⏱️</span>
              <div>
                <p className="text-2xs font-bold text-gray-500 uppercase tracking-wider">Rest Schedule</p>
                <p className="text-xs font-semibold text-gray-800">
                  {recommendation.restInstruction}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4-Point Worker Wellness Protocol */}
        <div className="pt-2 border-t border-gray-200/80">
          <p className="text-2xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1">
            <span>🛡️</span> Worker Wellness Checklist (4 Points)
          </p>

          <div className="space-y-2">
            {wellnessPoints.map((point, index) => (
              <div
                key={index}
                className="p-2 bg-white/90 rounded-xl border border-gray-100 shadow-xs flex items-start gap-2 text-xs"
              >
                <span className="text-sm mt-0.5 shrink-0">{point.icon}</span>
                <div className="leading-tight">
                  <p className="font-bold text-gray-900 text-2xs">{point.title}</p>
                  <p className="text-2xs text-gray-600 leading-normal mt-0.5">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200 text-2xs text-gray-400 text-center">
        Stay safe • Drink water • Rest in shade • Report heat stress
      </div>
    </div>
  );
};
