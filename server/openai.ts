import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAnalytics(data: {
  scenarioName: string;
  selectedScenarioId: string;
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  scoreDistribution: any[];
  passFailRatio: any[];
}) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert analytics assistant for a military loadmaster training application. Your task is to analyze student performance data and provide actionable insights."
        },
        {
          role: "user",
          content: `
Please analyze the following training data and provide a brief interpretation paragraph. Focus on key insights and recommendations:

Scenario: ${data.scenarioName || "All Scenarios"}
Total Submissions: ${data.totalSubmissions}
Average Score: ${data.averageScore.toFixed(1)}%
Pass Rate: ${data.passRate.toFixed(1)}%

Score Distribution:
${data.scoreDistribution.map(item => `- ${item.range}: ${item.count} students`).join('\n')}

Pass/Fail Ratio:
${data.passFailRatio.map(item => `- ${item.name}: ${item.value} students`).join('\n')}

Based on this data, what insights can you provide about student performance, and what recommendations would you suggest for instructors to improve training outcomes?
`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || "No analysis available";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Unable to generate analytics insight at this time. Please try again later.";
  }
}