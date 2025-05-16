import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interface for cargo balance analysis data
interface CargoBalanceData {
  message: string;
  aircraftType: string;
  cargoData: any;
  balanceValue: number;
  balanceCG: number;
}

export async function analyzeCargoBalance(data: CargoBalanceData) {
  try {
    // Create a context-rich prompt for the model
    const aircraftSpecs = getAircraftSpecs(data.aircraftType);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert cargo loadmaster assistant specializing in aircraft cargo weight and balance analysis. 
You provide helpful advice regarding:
- Balance optimization for ${data.aircraftType} aircraft
- Safety recommendations for cargo positioning
- Weight distribution best practices
- Center of Gravity (CG) adjustments
- Cargo loading strategy

Aircraft specifications:
${aircraftSpecs}`
        },
        {
          role: "user",
          content: `${data.message || "Please analyze my current cargo configuration."}

Current cargo configuration:
- Aircraft type: ${data.aircraftType}
- Balance value: ${data.balanceValue} (range from -100 to 100, where 0 is optimal)
- Center of Gravity: ${data.balanceCG.toFixed(2)}° (acceptable range: 18° to 88°)
- Cargo data: ${JSON.stringify(data.cargoData, null, 2)}

Please provide a concise analysis of the current cargo configuration, focusing on balance, safety, and optimization. Suggest specific improvements if needed.`
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    return response.choices[0].message.content || "No analysis available";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Unable to analyze cargo balance at this time. Please try again later.";
  }
}

// Helper function to get aircraft specs for context
function getAircraftSpecs(aircraftType: string): string {
  const specs: Record<string, string> = {
    c27j: `C-27J Spartan:
- Maximum payload: 11,300 kg
- Maximum pallet weight: 4,536 kg
- Standard cargo configuration: 3 pallets
- Optimal Center of Gravity range: 18° to 88°`,

    c17: `C-17 Globemaster:
- Maximum payload: 77,500 kg
- Maximum pallet weight: 10,000 kg
- Standard cargo configuration: 18 pallets (9×2 layout)
- Optimal Center of Gravity range: 18° to 88°`,

    c130: `C-130 Hercules:
- Maximum payload: 20,000 kg
- Maximum pallet weight: 4,536 kg
- Standard cargo configuration: 8 pallets
- Optimal Center of Gravity range: 18° to 88°`,

    kc30a: `KC30-A Airbus:
- Maximum payload: 45,000 kg
- Maximum pallet weight: 6,800 kg
- Variable cargo configurations
- Optimal Center of Gravity range: 18° to 88°`
  };

  return specs[aircraftType] || "Aircraft specifications unavailable";
}

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