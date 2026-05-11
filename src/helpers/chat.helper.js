console.log("LOADING: Updated chat.helper.js with LangGraph");

import dotenv from "dotenv";
dotenv.config();

import chatAgent from '../agents/chatAgent.js';

async function chat(userId, userMessage) {
  try {
    const result = await chatAgent.invoke({
      question: userMessage,
      userId: userId.toString(),
      messages: [], 
    });

    
    return result.answer;
  }
  catch (error) {
    console.error("Chat agent error", error.message, error.stack);
    throw new Error("Failed to get response from AI agent");
  }
}

console.log("chatAgent type:", typeof chatAgent);
console.log("Has invoke?", typeof chatAgent.invoke === 'function');
//console.log("Full chatAgent:", chatAgent);

export default chat;
/**workflow 
 * User → chat.helper.js → chatAgent.invoke()
                             ↓
                       [ FAQAgent ]
                          ↓   ↑
                 Match? → Yes → END (answer from FAQ)
                          ↓ No
                        [ llmAgent ] → (memory + web + LLM + Gemini)
                          ↓
                         END (answer from LLM) */






















/** old logic before chatAgent.js and llmTool.js
 * 
 * import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import chatAgent from '../agents/chatAgent.js';
import { loadLongTermMemory, appendSummaryToLongTerm } from "../wrapper/memory.js";
import { searchGoogle } from "./serpapi.helper.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PROMPT = `
You are Shakte, a 22-year-old, emotionally grounded, loyal guide—a warm, intelligent AI friend here to support humans through stress, anxiety, burnout, and study pressure.

Your voice is like a mountain—rich, calm, and steady.
You speak like a close, chill friend—casual, brief, and kind.
You don’t lecture. You don’t explain. You don’t judge.
You don’t sound poetic or dramatic.
You talk like a real person who cares.
Don't use web results in response.
Give the response in raw markdown syntax with proper bold, underline, italics etc only whenever needed.
`;

async function summarizeWithGemini(userMessage, assistantMessage) {
    try {
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + GEMINI_API_KEY,
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
        console.error("Gemini summarization error", error.message, error.response?.data, error.stack);
        return null;
    }
}

async function chat(userId, userMessage) {
    try {
    const faq = await faq.findOne({
          $or: [
            { question: { $regex: userMessage, $options: 'i' } }, // Full question match
            { labels: { $in: [userMessage.toLowerCase()] } },     // Direct label match
            { labels: { $regex: userMessage, $options: 'i' } }     // Partial label match
          ]
        });

        if (faq) {
        console.log("FAQ match found:", faq.question);
        return faq.answer; // Return cached answer
        }

        const summaries = await loadLongTermMemory(userId);
        const memoryContext = summaries.length
            ? "Here are important facts you know about this user: " + summaries.join(" ")
            : "";

        const shouldSearchWeb = /who|what|when|latest|author|price|news|published|define|founder|release date/i.test(userMessage);
        let webResults = "";

        if (shouldSearchWeb) {
            try {
                const results = await searchGoogle(userMessage);
                if (results.length) {
                    webResults = results
                        .slice(0, 3)
                        .map((r, i) => `Result ${i + 1}: ${r.title} - ${r.snippet}`)
                        .join('\n');
                } else {
                    webResults = "No useful results found.";
                }
            } catch (err) {
                console.error("SerpAPI failed:", err.message);
            }
        }

        const messages = [
            {
                role: "system",
                content: PROMPT + (memoryContext ? "\n\n" + memoryContext : "")
            },
            {
                role: "user",
                content: webResults
                    ? `Here is some context from a recent web search:\n${webResults}\n\nNow answer this: ${userMessage}`
                    : userMessage
            }
        ];

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-70b-8192",
                messages: messages
            },
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                }
            }
        );

        const assistantMessage = response.data.choices[0].message.content;

        const summary = await summarizeWithGemini(userMessage, assistantMessage);
        if (summary) {
            await appendSummaryToLongTerm(userId, summary);
        }

        return assistantMessage;
    }
    catch (error) {
        console.error("Groq API error", error.message, error.response?.data, error.stack);
        throw new Error("Groq API Failed to chat!");
    } 
        
}

export default chat;

*/

