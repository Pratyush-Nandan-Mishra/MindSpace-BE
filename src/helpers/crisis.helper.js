// Crisis & stress detection patterns with tiered severity

const CRISIS_PATTERNS = [
  /\b(suicide|suicidal|kill myself|end my life|take my life|want to die|don't want to live|wish i was dead|better off dead|no reason to live|can't go on)\b/i,
];

const HIGH_STRESS_PATTERNS = [
  /\b(self.?harm|hurt myself|cutting|overdose|starving myself)\b/i,
];

const MODERATE_STRESS_PATTERNS = [
  /\b(panic attack|breaking down|falling apart|can't cope|can't take it|completely lost|helpless|hopeless|worthless|nobody cares|all alone|give up)\b/i,
];

export const RESOURCES = `
**If you're in crisis, please reach out — you deserve immediate support:**

🇮🇳 **India:**
- **iCall** (TISS): 9152987821 *(Mon–Sat, 8am–10pm)*
- **Vandrevala Foundation**: 1860-2662-345 *(24/7)*
- **NIMHANS**: 080-46110007
- **Snehi**: 044-24640050

🌍 **International:**
- **Crisis Text Line**: Text HOME to 741741 *(US/UK/Canada)*
- **Befrienders Worldwide**: befrienders.org

💬 *You can also speak to a counselor or trusted person in your life.*
`;

export function detectCrisisLevel(text) {
  if (CRISIS_PATTERNS.some(p => p.test(text))) return "crisis";
  if (HIGH_STRESS_PATTERNS.some(p => p.test(text))) return "high";
  if (MODERATE_STRESS_PATTERNS.some(p => p.test(text))) return "moderate";
  return "none";
}

export function getCrisisPrefix(level) {
  if (level === "crisis") {
    return `I hear you, and what you're feeling matters deeply. Please know you're not alone in this moment.\n\n${RESOURCES}\n\nI'm still here with you — can you tell me more about what's happening?\n\n`;
  }
  if (level === "high") {
    return `I'm really concerned about you right now, and I want you to know I'm here.\n\n${RESOURCES}\n\n`;
  }
  if (level === "moderate") {
    return `That sounds really painful, and I want you to know you don't have to carry this alone.\n\n`;
  }
  return "";
}
