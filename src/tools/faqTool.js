import { Tool } from "@langchain/core/tools";
import FAQ from "../models/FAQ.js";

// emotional wellness categories
const EMOTIONAL_CATEGORIES = [
  "Relationships (Romantic & Platonic)",
  "Bullying & Cyberbullying",
  "Career Exploration & Job Stress",
  "Grief & Loss",
  "Physical Health & Wellness",
  "Technology Overload & Digital Detox",
  "Cultural/Societal Expectations",
  "Imposter Syndrome",
  "Conflict Resolution Skills",
  "Transition Challenges",
  "Creativity & Passion Pursuits",
  "Trust & Betrayal",
  "Resilience & Coping Mechanisms",
  "Spiritual Exploration"
];

// Keywords that suggest academic/scientific intent (bypass FAQ)
const ACADEMIC_KEYWORDS = [
  "formula", "calculate", "equation", "physics", "math", "science",
  "derivative", "proof", "theorem", "class", "homework", "assignment",
  "exam", "numerical", "solve", "derivation", "mechanical", "force", "area"
];

  // Safe, non-mutating similarity function
  function computeSimilarity(str1, str2) {
    const normalize = (text) =>
      text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    const words1 = normalize(str1);
    const words2 = normalize(str2);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = [...set1].filter(word => set2.has(word)).length;
    const union = set1.size + set2.size;

    return union === 0 ? 0 : (2 * intersection) / union; // Dice coefficient
  }


export class FAQTool extends Tool {
  name = "faq-search";
  description = "Search FAQs using category and label context";

  
  async _call(query) {
    const q = query.toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);

    console.log("FAQTool: Processing query:", query);

    //Block academic/scientific queries
    if (ACADEMIC_KEYWORDS.some(kw => q.includes(kw))) {
      console.log("Academic intent detected — bypassing FAQ");
      return "No high-confidence FAQ match found.";
    }

    // //Build search query
    // const searchQuery = {
    //   $or: [
    //     { question: { $regex: q, $options: 'i' } },
    //     { labels: { $in: words } },
    //     { category: { $regex: q, $options: 'i' } }
    //   ]
    // };

    try {
      //Fetch candidates
      const candidates = await FAQ.find({});
      console.log(`Found ${candidates.length} FAQ candidates`);

      if (candidates.length === 0) {
        return "No matching FAQ found.";
      }

      //Score each candidate
      const scored = candidates.map(faq => {
        const faqQuestion = faq.question.toLowerCase();

        const semanticScore = computeSimilarity(q, faqQuestion);

        let keywordScore = 0;        

        //Full question match (high weight)
        if (faqQuestion.includes(q)) keywordScore += 10;

        //Label matches (exact or partial)
        const labelMatches = faq.labels?.filter(label => {
          const labelLower = label.toLowerCase();
          return words.includes(labelLower) ||
                 words.some(word => labelLower.includes(word));
        }) || [];
        keywordScore += labelMatches.length * 5;
        //console.log(`FAQ: "${faq.question}" | Label matches: ${labelMatches.length}`);

        //Category match (bonus)
        if (faq.category && q.includes(faq.category.toLowerCase())) {
          keywordScore += 8;
        }

        //Bonus: Category is in known emotional list
        if (EMOTIONAL_CATEGORIES.includes(faq.category)) {
          keywordScore += 2; 
        }

        // Final score:semantic + keyword
        // Weight: 70% semantic, 30% keyword 
        const finalScore = (semanticScore * 0.7) + (keywordScore / 50 * 0.3); // Normalize (0–1)

        return { faq, score: finalScore, semanticScore, keywordScore };
      });

      // Sort by score
      const best = scored.sort((a, b) => b.score - a.score)[0];

      // Only return if high confidence (semantic + keyword)
      if (best.score < 0.5) {
        console.log(`Low-confidence match (final: ${best.score.toFixed(3)}, semantic: ${best.semanticScore.toFixed(3)}) — deferring to LLM`);
        return "No high-confidence FAQ match found.";
      }

      console.log(`High-confidence FAQ match (score: ${best.score}):`, best.faq.question);
      return `Q: ${best.faq.question}\nA: ${best.faq.answer}`;
    }
    catch (error) {
      console.error("FAQ search error:", error);
      return "Error searching FAQs.";
    }
  }
}