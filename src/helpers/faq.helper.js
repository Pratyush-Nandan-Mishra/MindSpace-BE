import FAQ from '../models/FAQ.js';


const LABEL_MAP = {
  mental: ['mental health', 'emotional distress', 'coping'],
  stress: ['stress', 'anxiety', 'burnout'],
  panic: ['panic', 'grounding', 'breathing', 'crisis'],
  relationship: ['relationships', 'trust', 'conflict'],
  self_harm: ['self-harm', 'suicidal thoughts', 'crisis'],
  password: ['account', 'security', 'login', 'reset'],
  grief: ['grief', 'loss', 'mourning'],
  career: ['career', 'job stress', 'exploration']
};


const CATEGORY_MAP = {
  mental: "Mental Health",
  stress: "Resilience & Coping Mechanisms",
  panic: "Resilience & Coping Mechanisms",
  relationship: "Relationships (Romantic & Platonic)",
  self_harm: "Resilience & Coping Mechanisms",
  grief: "Grief & Loss",
  career: "Career Exploration & Job Stress",
  password: "Physical Health & Wellness"
}

/**
 * Extract labels and category from question
 */
function extractTags(question) {
  const q = question.toLowerCase();
  const labels = new Set();
  let category = "General Guidance";

  // Match keywords and add labels + category
  Object.entries(LABEL_MAP).forEach(([key, value]) => {
    if (q.includes(key)) {
      value.forEach(label => labels.add(label));
      category = CATEGORY_MAP[key];
    }
  });

  // Fallback: Add generic emotional labels for distress words
  if (q.includes("harm") || q.includes("suicidal")) {
    labels.add("self-harm");
    category = "Resilience & Coping Mechanisms";
  }

  return {
    labels: Array.from(labels),
    category
  };
}


//Save a new Q&A pair to FAQ database (if not duplicate)
async function saveToFAQ(question, answer) {
  if (!shouldSaveToFAQ(question, answer)) {
    console.log("Not saving low-quality Q&A");
    return false;
  }

  try {
    // Avoid duplicates: check semantic similarity
    const existing = await FAQ.findOne({});
    const candidates = await FAQ.find({
      $or: [
        { question: { $regex: question, $options: 'i' } },
        { labels: { $in: extractTags(question).labels } }
      ]
    });

    if (candidates.length > 0) {
      console.log("Similar FAQ already exists — not saving duplicate");
      return false;
    }

    
    const { labels, category } = extractTags(question);

    // Create new FAQ
    const newFAQ = new FAQ({
      question: question.trim(),
      answer: answer.trim(),
      labels,
      category
    });

    await newFAQ.save();
    console.log("New FAQ saved:", question);
    return true;
  }
  catch (error) {
    console.error("Failed to save FAQ:", error);
    return false;
  }
}

export function shouldSaveToFAQ(question, answer) {
  const a = answer.toLowerCase();
  const q = question.toLowerCase();

  const lowQuality = [
    /hello/i, /hi /i, /how are you/i, /i don't know/i, /sorry/i, /not sure/i
  ];

  if (lowQuality.some(p => a.match(p))) return false;
  if (a.split(/\s+/).length < 10) return false;
  if (a.length > 150) return true;
  if (["how to", "what is", "explain", "help with"].some(t => q.includes(t))) return true;

  return false;
}

export default saveToFAQ;