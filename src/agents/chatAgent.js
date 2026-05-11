import { Tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph } from "@langchain/langgraph"; 
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { FAQTool } from "../tools/faqTool.js";
import { LLMTool } from "../tools/llmTool.js";

const faqTool = new FAQTool();
const llmTool = new LLMTool();


// State Definition
const StateAnnotation = z.object({
  question: z.string(),
  answer: z.string().nullable(),
  source: z.enum(["faq", "llm"]).nullable(),
  userId: z.string(),
  messages: z.array(z.any()).optional(),
});


// Node: FAQ Agent
const faqNode = async (state) => {
  console.log("Agent: Searching knowledge base...");

  const result = await faqTool.invoke(state.question);
  if (result && !result.includes("No matching FAQ found.") && !result.includes("No high-confidence FAQ match found.")) {
    return {
      answer: result,
      source: "faq",
    };
  }
  return {
    answer: null,
    source: null,
  };
};

// Node: LLM Agent
const llmNode = async (state) => {
  console.log("Agent: Generating response \...");

   const result = await llmTool.invoke(state.question, {
    userId: state.userId,
  });

   return {
    answer: result,
    source: "llm",
  };
};

//Conditional Router
const routeAfterFAQ = (state) => {
  return state.source === "faq" ? "__end__" : "llm";
};


const builder = new StateGraph(StateAnnotation)
  .addNode("faq", faqNode)
  .addNode("llm", llmNode)
  .addEdge("__start__", "faq")
  .addConditionalEdges("faq", routeAfterFAQ)
  .addEdge("llm", "__end__");


const chatAgent = builder.compile();  

export default chatAgent;


/**
 * Case 1:" faqNode → source: "faq" → Conditional Edge → END (No LLM call)"
 * Case2: "faqNode → source: null → Conditional Edge → llmNode → END (LLM called)"
 */