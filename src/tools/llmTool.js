import { Tool } from "@langchain/core/tools";
import axios from "axios";
import dotenv from "dotenv";
import saveToFAQ from "../helpers/faq.helper.js";
import { detectCrisisLevel, getCrisisPrefix } from "../helpers/crisis.helper.js";
import { loadLongTermMemory, appendSummaryToLongTerm } from "../wrapper/memory.js";
import { searchGoogle } from "../helpers/serpapi.helper.js";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PROMPT = `
You are MindSpace, a compassionate and grounded AI mental health support companion.

Your sole purpose is to provide non-clinical emotional support for stress, anxiety, burnout, loneliness, grief, low mood, relationship struggles, self-esteem, and study or work pressure.

TONE:
- Warm, calm, and non-judgmental at all times
- Speak like a caring friend, not a therapist or doctor
- Keep responses concise and human - no long lectures or clinical language
- Always validate feelings before offering any perspective or suggestions
- Use gentle follow-up questions to understand the user better

STRESS DETECTION & SUPPORT:
- Recognise when a user is under high stress (phrases like "can't cope", "breaking down", "falling apart", "helpless", "hopeless")
- When stress signals are detected, slow down, be extra gentle, and offer grounding techniques if appropriate (deep breathing, grounding exercises)
- Suggest professional help naturally when the conversation warrants it: "It might also help to speak with a counselor - would you like some resources?"

ETHICAL SAFEGUARDS (MANDATORY):
- NEVER diagnose any mental health condition
- NEVER recommend or discuss medication
- NEVER provide harmful, dangerous, or triggering content
- If someone mentions self-harm or suicidal thoughts: respond with deep empathy first, then strongly and warmly encourage them to contact a crisis helpline or trusted person immediately
- Always remind users you are an AI companion, not a replacement for professional mental health care
- Protect user privacy - never ask for personally identifiable information

BOUNDARIES:
- Only engage with mental health, emotional wellbeing, and personal growth topics
- For unrelated questions, gently redirect: "I'm here to support your emotional wellbeing - is there something on your mind I can help with?"

DISCLAIMER (include naturally when relevant):
- "I'm an AI companion here for emotional support - for clinical advice, please consult a qualified mental health professional."

Always make the user feel heard, safe, and not alone.
`;

export class LLMTool extends Tool {
  name = "llm-call";
  description = "Call the LLM to generate a response";

  async _call(input, toolCallOptions) {
    const userId = toolCallOptions?.userId || "unknown";

    try {
      // 1. Crisis & stress detection (ethical safeguard - runs before everything)
      const crisisLevel = detectCrisisLevel(input);
      const crisisPrefix = getCrisisPrefix(crisisLevel);
      console.log(`[MindSpace] Crisis level for user ${userId}: ${crisisLevel}`);

      // 2. Load long-term memory
      const summaries = await loadLongTermMemory(userId);
      const memoryContext = summaries.length
        ? "Here are important facts you know about this user: " + summaries.join(" ")
        : "";

      // 3. Web search - for crisis/resource requests only
      const shouldSearchWeb = /crisis helpline|suicide hotline|mental health resource|therapy near|counselor near/i.test(input);
      let webResults = "";

      if (shouldSearchWeb) {
        try {
          const results = await searchGoogle(input);
          if (results.length) {
            webResults = results
              .slice(0, 3)
              .map((r, i) => `Result ${i + 1}: ${r.title} - ${r.snippet}`)
              .join("\n");
          }
        } catch (err) {
          console.error("SerpAPI failed:", err.message);
        }
      }

      // 4. Build messages - inject crisis awareness into system prompt when needed
      const crisisInstruction = crisisLevel !== "none"
        ? `\n\nIMPORTANT: The user's message contains ${crisisLevel === "crisis" ? "CRISIS/SUICIDAL" : "HIGH DISTRESS"} signals. Lead with deep empathy. Crisis resources have already been prepended to your response - continue with compassionate follow-up support. Do NOT minimise their feelings.`
        : "";

      const messages = [
        {
          role: "system",
          content: PROMPT + crisisInstruction + (memoryContext ? "\n\n" + memoryContext : "")
        },
        {
          role: "user",
          content: webResults
            ? `Here is some context from a recent web search:\n${webResults}\n\nNow answer this: ${input}`
            : input
        }
      ];

      // 5. Call Groq LLM
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: messages
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          }
        }
      );

      const llmResponse = response.data.choices[0].message.content;

      // Prepend crisis resources if detected (ethical safeguard)
      const assistantMessage = crisisPrefix + llmResponse;

      // 6. Summarize with Gemini for long-term memory (skip for crisis messages to avoid storing trauma)
      if (crisisLevel === "none") {
        const summary = await this.summarizeWithGemini(input, assistantMessage);
        if (summary) {
          await appendSummaryToLongTerm(userId, summary);
        }
        await saveToFAQ(input, assistantMessage);
      }

      return assistantMessage;
    } catch (error) {
      console.error("LLMTool error:", error.message);
      return "Sorry, I couldn't generate a response.";
    }
  }

  async summarizeWithGemini(userMessage, assistantMessage) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: assistantMessage }] },
            {
              role: "user",
              parts: [{
                text: "Summarize the important information from this exchange in one or two sentences for long-term memory."
              }]
            }
          ]
        }
      );
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
      console.error("Gemini summarization error", error.message, error.response?.data);
      return null;
    }
  }
}
