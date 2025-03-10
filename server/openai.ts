import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ScenarioComplexity {
  name: string;
  complexity: number; // 1-10
  factors: {
    stepCount: number;
    dataDependencies: number;
    conditionalLogic: number;
    technicalDifficulty: number;
  };
  explanation: string;
}

interface FeatureComplexity {
  overallComplexity: number; // 1-10
  scenarios: ScenarioComplexity[];
  recommendations: string[];
}

async function generateFeature(
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
    - IMPORTANT: Include exactly one tag at the top of the feature file

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

interface FeatureAnalysis {
  quality_score: number;
  suggestions: string[];
  improved_title?: string;
}

async function analyzeFeature(content: string, currentTitle: string): Promise<FeatureAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in BDD and Cucumber feature analysis. Analyze the given feature file and provide quality feedback and suggestions for improvement. Focus on business value, clarity, and adherence to BDD best practices."
        },
        {
          role: "user",
          content: `Analyze this Cucumber feature and provide:
          1. A quality score (0-100)
          2. Specific suggestions for improvement
          3. A suggested improved title if the current one can be better

          Current title: "${currentTitle}"

          Feature content:
          ${content}

          Respond in JSON format with these keys:
          - quality_score: number
          - suggestions: array of strings
          - improved_title: string (optional, only if you have a better suggestion)`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      quality_score: Math.min(100, Math.max(0, result.quality_score)),
      suggestions: result.suggestions || [],
      improved_title: result.improved_title
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze feature: ${error.message}`);
  }
}

async function suggestTitle(story: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in creating clear, concise titles for BDD features. Generate title suggestions that are descriptive yet concise."
        },
        {
          role: "user",
          content: `Based on this user story, suggest 3 clear and concise feature titles:

          ${story}

          Respond in JSON format with an array of strings under the key "titles".
          Each title should be:
          - Clear and descriptive
          - Concise (max 5 words)
          - Follow proper capitalization
          - Focused on the business value`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.titles || [];
  } catch (error: any) {
    throw new Error(`Failed to suggest titles: ${error.message}`);
  }
}

async function analyzeFeatureComplexity(content: string): Promise<FeatureComplexity> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in analyzing Cucumber feature complexity. Analyze the given feature file and provide complexity scores and insights."
        },
        {
          role: "user",
          content: `Analyze this Cucumber feature's complexity. For each scenario, consider:
          1. Number of steps
          2. Data dependencies (parameters, tables, etc.)
          3. Conditional logic (But, And, etc.)
          4. Technical implementation difficulty

          Feature content:
          ${content}

          Respond in JSON format with:
          - overallComplexity: number 1-10
          - scenarios: array of {
              name: string,
              complexity: number 1-10,
              factors: {
                stepCount: number,
                dataDependencies: number,
                conditionalLogic: number,
                technicalDifficulty: number
              },
              explanation: string
            }
          - recommendations: array of improvement suggestions`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      overallComplexity: Math.min(10, Math.max(1, result.overallComplexity || 1)),
      scenarios: (result.scenarios || []).map((scenario: any) => ({
        name: scenario.name || "Unnamed Scenario",
        complexity: Math.min(10, Math.max(1, scenario.complexity || 1)),
        factors: {
          stepCount: scenario.factors?.stepCount || 0,
          dataDependencies: scenario.factors?.dataDependencies || 0,
          conditionalLogic: scenario.factors?.conditionalLogic || 0,
          technicalDifficulty: scenario.factors?.technicalDifficulty || 0
        },
        explanation: scenario.explanation || ""
      })),
      recommendations: result.recommendations || []
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze feature complexity: ${error.message}`);
  }
}

export { generateFeature, analyzeFeature, suggestTitle, analyzeFeatureComplexity };