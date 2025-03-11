import { openai } from "./openai";

async function generateProductNames(description: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a creative naming expert. Generate product names that are memorable, unique, and reflect the product's purpose."
      },
      {
        role: "user",
        content: `Generate 5 creative product names for this product:
        ${description}

        Consider these aspects:
        - Easy to remember and pronounce
        - Reflects AI/automation capability
        - Relates to testing/BDD concepts
        - Sounds professional and trustworthy
        - Available as a domain name (generic terms)

        Format: Return a JSON array of objects with name and reasoning.`
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content || "[]");
}

// Example description
const productDescription = `
An AI-powered tool that automatically generates Cucumber/BDD feature files for software testing.
Key features:
- AI-powered feature generation
- Test scenario automation
- Quality analysis
- Complexity scoring
- Real-time collaboration
Target audience: Software development teams, QA engineers, and BDD practitioners
`;

export { generateProductNames, productDescription };