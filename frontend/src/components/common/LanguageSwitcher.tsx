
import { useLocalization } from '../../hooks/useLocalization';
export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLocalization();
  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="p-2 border rounded">
      <option value="en">English</option>
      <option value="te">తెలుగు</option>
      <option value="hi">हिंदी</option>
    </select>
  );
};
