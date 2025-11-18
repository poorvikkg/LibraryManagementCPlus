export const analyzeEmotionText = (text) => {
  if (!text) return "neutral";
  const lower = text.toLowerCase();
  if (lower.includes("tired") || lower.includes("sad") || lower.includes("stressed")) return "stressed";
  if (lower.includes("happy") || lower.includes("good") || lower.includes("joy")) return "happy";
  return "neutral";
};
