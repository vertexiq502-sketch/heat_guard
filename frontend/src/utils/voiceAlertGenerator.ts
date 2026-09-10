export interface VoiceAlertContext {
  weather?: {
    temperature?: number;
    humidity?: number;
    uv_index?: number;
    confidence?: string;
    is_stale?: boolean;
  } | null;
  risk?: {
    risk_level?: string;
    risk_score?: number;
    effective_temp?: number;
    confidence?: string;
    explanation?: string;
    recommendation?: {
      workStatus?: string;
      restInstruction?: string;
      hydrationInstruction?: string;
      additionalGuidance?: string;
    };
  } | null;
  profile?: {
    worker_type?: string | null;
    intensity?: string | null;
    exposure?: string | null;
    clothing?: string | null;
    duration?: string | null;
  } | null;
  alert?: {
    title?: string;
    message?: string;
    title_te?: string;
    message_te?: string;
    title_hi?: string;
    message_hi?: string;
  } | null;
}

/**
 * Generates natural, accessible spoken text for outdoor workers in English, Telugu, or Hindi.
 * Explains:
 *  1. Current environmental conditions
 *  2. Current personalized heat-risk level & score
 *  3. Stale data / confidence notice if applicable
 *  4. Contributing factors (why the worker has this risk)
 *  5. Practical wellness and safety guidance
 *
 * Targets approx. 20-35 seconds of natural speech.
 */
export function generateVoiceAlertScript(
  ctx: VoiceAlertContext,
  language: string
): string {
  const lang = (language || 'en').toLowerCase().trim();
  const weather = ctx.weather;
  const risk = ctx.risk;
  const profile = ctx.profile;

  const temp = weather?.temperature !== undefined ? Math.round(weather.temperature) : null;
  const humidity = weather?.humidity !== undefined ? Math.round(weather.humidity) : null;

  const rawLevel = (risk?.risk_level || 'green').toLowerCase();
  const isDanger = rawLevel === 'red' || rawLevel === 'danger';
  const isHighRisk = rawLevel === 'orange' || rawLevel === 'high_risk';
  const isCaution = rawLevel === 'yellow' || rawLevel === 'caution';

  const score =
    risk?.risk_score !== undefined
      ? Math.round(risk.risk_score)
      : risk?.effective_temp !== undefined
      ? Math.round(risk.effective_temp)
      : null;

  const isStale =
    weather?.is_stale === true ||
    weather?.confidence === 'low' ||
    risk?.confidence === 'low';

  // ──────────────────────────────────────────────────────────
  // 1. TELUGU SCRIPT
  // ──────────────────────────────────────────────────────────
  if (lang === 'te') {
    const segments: string[] = ['వేడి భద్రతా హెచ్చరిక.'];

    if (temp !== null && humidity !== null) {
      segments.push(`ప్రస్తుత ఉష్ణోగ్రత ${temp} డిగ్రీల సెల్సియస్ మరియు తేమ ${humidity} శాతం ఉంది.`);
    } else if (temp !== null) {
      segments.push(`ప్రస్తుత ఉష్ణోగ్రత ${temp} డిగ్రీల సెల్సియస్ ఉంది.`);
    }

    const levelTe = isDanger
      ? 'ప్రమాదం'
      : isHighRisk
      ? 'అధిక ప్రమాదం'
      : isCaution
      ? 'జాగ్రత్త'
      : 'సురక్షితం';

    if (score !== null) {
      segments.push(`మీ వ్యక్తిగతీకరించిన వేడి ప్రమాద స్థాయి ${levelTe}, మరియు రిస్క్ స్కోరు ${score}.`);
    } else {
      segments.push(`మీ వ్యక్తిగతీకరించిన వేడి ప్రమాద స్థాయి ${levelTe}.`);
    }

    if (isStale) {
      segments.push('వాతావరణ సమాచారం ఆలస్యమైంది, కాబట్టి ఈ అంచనా విశ్వసనీయత తక్కువగా ఉంది.');
    }

    // Contributing factors
    if (isDanger || isHighRisk) {
      if (profile?.exposure === 'fullSun' && profile?.intensity === 'heavy') {
        segments.push('ఎండలో నేరుగా పని చేయడం మరియు అధిక శారీరక శ్రమ వలన మీ ప్రమాదం పెరిగింది.');
      } else if (profile?.exposure === 'fullSun') {
        segments.push('ఎండ తీవ్రత ఎక్కువగా ఉండటం వలన మీ ప్రమాదం పెరిగింది.');
      } else if (profile?.intensity === 'heavy') {
        segments.push('కఠినమైన పని భారం వలన మీ వేడి ఒత్తిడి పెరిగింది.');
      }
    }

    // Actionable wellness advice
    if (isDanger) {
      segments.push(
        'దయచేసి వెంటనే పనిని ఆపి నీడ ఉన్న చల్లని ప్రదేశానికి చేరుకోండి. పుష్కలంగా చల్లని నీరు లేదా ఓఆర్ఎస్ త్రాగండి. కళ్ళు తిరగడం లేదా నీరసంగా అనిపిస్తే వెంటనే మీ సైట్ సూపర్‌వైజర్‌కు తెలపండి.'
      );
    } else if (isHighRisk || isCaution) {
      segments.push(
        'దయచేసి ప్రతి గంటకు నీడలో విశ్రాంతి తీసుకోండి, తరచుగా నీరు లేదా ఓఆర్ఎస్ త్రాగండి, మరియు అలసటగా అనిపిస్తే సూపర్‌వైజర్‌కు తెలియజేయండి.'
      );
    } else {
      segments.push(
        'వాతావరణం ప్రస్తుతం సురక్షితంగా ఉంది. క్రమం తప్పకుండా నీరు త్రాగుతూ జాగ్రత్తగా పని చేయండి.'
      );
    }

    return segments.join(' ');
  }

  // ──────────────────────────────────────────────────────────
  // 2. HINDI SCRIPT
  // ──────────────────────────────────────────────────────────
  if (lang === 'hi') {
    const segments: string[] = ['हीट सुरक्षा अलर्ट।'];

    if (temp !== null && humidity !== null) {
      segments.push(`वर्तमान तापमान ${temp} डिग्री सेल्सियस और नमी ${humidity} प्रतिशत है।`);
    } else if (temp !== null) {
      segments.push(`वर्तमान तापमान ${temp} डिग्री सेल्सियस है।`);
    }

    const levelHi = isDanger
      ? 'खतरा'
      : isHighRisk
      ? 'उच्च जोखिम'
      : isCaution
      ? 'सावधानी'
      : 'सुरक्षित';

    if (score !== null) {
      segments.push(`आपका व्यक्तिगत हीट रिस्क स्तर ${levelHi} है, और रिस्क स्कोर ${score} है।`);
    } else {
      segments.push(`आपका व्यक्तिगत हीट रिस्क स्तर ${levelHi} है।`);
    }

    if (isStale) {
      segments.push('मौसम का डेटा विलंबित है, इसलिए इस आकलन की विश्वसनीयता कम है।');
    }

    // Contributing factors
    if (isDanger || isHighRisk) {
      if (profile?.exposure === 'fullSun' && profile?.intensity === 'heavy') {
        segments.push('सीधी धूप में काम करने और भारी शारीरिक श्रम के कारण आपका जोखिम बढ़ा हुआ है।');
      } else if (profile?.exposure === 'fullSun') {
        segments.push('सीधी धूप और गर्मी के कारण आपका जोखिम बढ़ा हुआ है।');
      } else if (profile?.intensity === 'heavy') {
        segments.push('भारी कार्य की तीव्रता के कारण शरीर का तापमान बढ़ सकता है।');
      }
    }

    // Actionable wellness advice
    if (isDanger) {
      segments.push(
        'कृपया तुरंत काम रोकें और छायादार ठंडे स्थान पर जाएं। पर्याप्त ठंडा पानी या ओआरएस पिएं। यदि चक्कर या कमजोरी महसूस हो, तो तुरंत अपने सुपरवाइजर को सूचित करें।'
      );
    } else if (isHighRisk || isCaution) {
      segments.push(
        'कृपया छाया में नियमित रूप से विश्राम लें, पर्याप्त मात्रा में पानी पिएं, और अत्यधिक थकान महसूस होने पर सुपरवाइजर को बताएं।'
      );
    } else {
      segments.push(
        'मौसम सामान्य है। नियमित रूप से पानी पीते रहें और सुरक्षित रूप से कार्य करें।'
      );
    }

    return segments.join(' ');
  }

  // ──────────────────────────────────────────────────────────
  // 3. ENGLISH SCRIPT (Default)
  // ──────────────────────────────────────────────────────────
  const segments: string[] = ['Heat safety alert.'];

  if (temp !== null && humidity !== null) {
    segments.push(`The current temperature is ${temp} degrees Celsius and humidity is ${humidity} percent.`);
  } else if (temp !== null) {
    segments.push(`The current temperature is ${temp} degrees Celsius.`);
  }

  const levelEn = isDanger
    ? 'Danger'
    : isHighRisk
    ? 'High Risk'
    : isCaution
    ? 'Caution'
    : 'Safe';

  if (score !== null) {
    segments.push(`Your current personalized heat risk is ${levelEn}, with a risk score of ${score}.`);
  } else {
    segments.push(`Your current personalized heat risk is ${levelEn}.`);
  }

  if (isStale) {
    segments.push('Weather data is currently delayed, so assessment confidence is reduced.');
  }

  // Contributing factors
  const factors: string[] = [];
  if (profile?.exposure === 'fullSun') factors.push('direct sun exposure');
  else if (profile?.exposure === 'partialShade') factors.push('partial sun exposure');

  if (profile?.intensity === 'heavy') factors.push('heavy physical workload');
  else if (profile?.intensity === 'moderate') factors.push('moderate work intensity');

  if (profile?.clothing === 'heavyPPE' || profile?.clothing === 'moderatePPE') {
    factors.push('protective clothing burden');
  }

  if (factors.length > 0 && (isDanger || isHighRisk || isCaution)) {
    segments.push(`Your risk is higher because of current heat conditions, ${factors.join(', and ')}.`);
  }

  // Actionable wellness advice
  if (isDanger) {
    segments.push(
      'Please reduce heat exposure immediately, take regular rest breaks in a cooler or shaded area, stay hydrated with cool water or electrolytes, and inform your supervisor immediately if you feel unwell.'
    );
  } else if (isHighRisk || isCaution) {
    segments.push(
      'Please take regular rest breaks in shaded areas, drink cool water frequently, and notify your supervisor if you experience fatigue or dizziness.'
    );
  } else {
    segments.push(
      'Conditions are currently safe. Stay hydrated with water throughout your shift and observe standard rest breaks.'
    );
  }

  return segments.join(' ');
}
