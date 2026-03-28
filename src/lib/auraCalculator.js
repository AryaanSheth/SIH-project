export function applyAuraModifier(currentScore, modifier) {
  return Number(currentScore || 0) + Number(modifier || 0);
}
