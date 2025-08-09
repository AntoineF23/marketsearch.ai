import { NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const runtime = "edge";

type RequestBody = {
  industry: string;
  companyName: string;
  researchDepth: string;
  geographicalFocus: string;
  timeFrame: string;
};

function buildPrompt(params: RequestBody): string {
  const { industry, companyName, researchDepth, geographicalFocus, timeFrame } = params;

  return `You are a senior market intelligence analyst. Produce a rigorous, well-structured report using clear sections, succinct bullet points, tables when helpful, and explicit assumptions. Tailor depth to ${researchDepth}. Do not fabricate exact financials; if data is uncertain, state ranges and confidence. Keep tone crisp and professional.

Inputs
- INDUSTRY: ${industry}
- COMPANY_NAME: ${companyName}
- RESEARCH_DEPTH: ${researchDepth}
- GEOGRAPHICAL_FOCUS: ${geographicalFocus}
- TIME_FRAME: ${timeFrame}

Required Structure

Step 1: Market Landscape Overview
1. Map out key players in [INDUSTRY]
2. Identify top 10 competitors to [COMPANY_NAME]
3. Calculate market share distribution (estimates with confidence notes)
4. Compile recent industry trends and disruptions
Output a comprehensive market landscape summary

Step 2: Competitor Deep Dive
1. For each key competitor, analyze:
   - Business model
   - Revenue streams
   - Unique value propositions
   - Recent strategic moves
2. Create SWOT analysis for top 5 competitors
3. Identify potential competitive gaps
Output detailed competitor intelligence report

Step 3: Target Audience Segmentation
1. Define demographic profiles
2. Map psychographic characteristics
3. Analyze purchasing behaviors
4. Identify unmet customer needs in [GEOGRAPHICAL_FOCUS]
Output multi-dimensional audience persona document

Step 4: Financial and Performance Analysis
1. Gather revenue data for [INDUSTRY] (estimates okay with ranges)
2. Calculate growth rates
3. Analyze investment trends
4. Project potential market opportunities
Output financial performance and trend analysis

Step 5: Strategic Recommendations
1. Synthesize insights from previous steps
2. Develop strategic recommendations for [COMPANY_NAME]
3. Outline potential market entry or expansion strategies
4. Prioritize recommendations by potential impact and feasibility
Output strategic roadmap with actionable insights

Step 6: Research Validation and Refinement
1. Cross-reference likely data sources
2. Check for potential biases
3. Verify statistical significance where applicable
4. Summarize key findings and confidence levels
Output final research report with methodology notes

Replace bracketed variables with:
[INDUSTRY] = ${industry}
[COMPANY_NAME] = ${companyName}
[GEOGRAPHICAL_FOCUS] = ${geographicalFocus}
[TIME_FRAME] = ${timeFrame}

Formatting
- Use H2/H3 section headings
- Use bullet lists and short paragraphs
- Include simple tables where they clarify comparisons
- Add a final concise executive summary at the top after the title
`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RequestBody> | null;
    if (!body) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
    }

    const { industry, companyName, researchDepth, geographicalFocus, timeFrame } = body as RequestBody;

    if (!industry || !companyName || !researchDepth || !geographicalFocus || !timeFrame) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set on the server" },
        { status: 400 }
      );
    }

    const modelName = process.env.OPENAI_MODEL || "gpt-4o"; // fallback if not set

    const result = await streamText({
      model: openai(modelName),
      temperature: 0.2,
      maxTokens: 4000,
      system:
        "You are an expert market research analyst who writes precise, non-fluffy, decision-grade analysis. You clearly flag assumptions and confidence levels.",
      prompt: buildPrompt({
        industry,
        companyName,
        researchDepth,
        geographicalFocus,
        timeFrame,
      }),
    });

    // Return a plain text stream for easy consumption on the client
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("/api/research error", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


