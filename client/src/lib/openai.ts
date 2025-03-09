import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export async function generateFeature(
  title: string,
  story: string,
  scenarioCount: number,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in writing Cucumber features. Generate a feature file based on the given title, story and number of scenarios requested. Follow Gherkin syntax.",
        },
        {
          role: "user",
          content: `Generate a Cucumber feature with:
Title: ${title}
Story: ${story}
Number of scenarios: ${scenarioCount}`,
        },
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    throw new Error(`Failed to generate feature: ${error.message}`);
  }
}
