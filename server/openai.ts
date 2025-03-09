import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateFeature(
  title: string,
  story: string,
  scenarioCount: number,
): Promise<string> {
  try {
    // Normalize feature title for tagging
    const featureTag = `@${title
      .split(/\s+/)
      .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
      .join('')}`;

    const aiPrompt = `Generate a Cucumber BDD feature file for the feature titled "${title}" with ${scenarioCount} scenarios.
    IMPORTANT: Use exactly ONE feature tag that matches this format: ${featureTag}

    Feature Story:
    ${story}

    Guidelines for Scenario Generation:
    - Write scenarios that describe the BUSINESS OUTCOME, not specific UI interactions
    - Use declarative language that focuses on WHAT should happen, not HOW it happens
    - Each scenario should represent a distinct business rule or acceptance criterion
    - Avoid mentioning specific UI elements or technical implementation details
    - Use clear, concise language that describes the expected system behavior
    - Scenarios should be understandable by non-technical stakeholders
    - IMPORTANT: Use a Background section for Given steps that are common across all scenarios
    - IMPORTANT: There should be no empty line between Feature: Title and the story
    - IMPORTANT: Include exactly ONE tag at the top of the feature file

    Example of Declarative vs Imperative:
    Imperative: "When I click the Add User button and enter details"
    Declarative: "When a new user is created with valid information"

    Example Format:
    ${featureTag}
    Feature: ${title}
    As a user, I want to do something
    So that I can achieve a goal

    Background:
      Given I am logged in as a user
      And I have necessary permissions

    Scenario: First Scenario
      When an action occurs
      Then there is an outcome`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in writing Cucumber features. Generate a feature file based on the given guidelines. Always include exactly ONE feature tag that matches the provided format, and use Background for common Given steps."
        },
        {
          role: "user",
          content: aiPrompt
        },
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    let featureContent = response.choices[0].message.content || "";

    // Ensure formatting is correct
    featureContent = featureContent.replace(/```gherkin|```/g, "").trim();

    // Remove any double newlines between Feature: and the story
    featureContent = featureContent.replace(/Feature:([^\n]+)\n\n/g, 'Feature:$1\n');

    // Ensure only one feature tag is present and it's the correct one
    featureContent = featureContent.replace(/@[\w]+\s*\n(@[\w]+\s*\n)*/, `${featureTag}\n`);

    return featureContent;
  } catch (error: any) {
    throw new Error(`Failed to generate feature: ${error.message}`);
  }
}