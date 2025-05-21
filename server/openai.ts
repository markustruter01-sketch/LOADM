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

export async function generateAdvancedAnalytics(data: {
  analysisType: string;
  overallStats: {
    totalStudents: number;
    totalSubmissions: number;
    avgScore: number;
    passRate: number;
  };
  squadronData?: {
    squadron: string;
    avgScore: number;
    passRate: number;
    submissions: number;
  }[];
  assessmentTypeData?: {
    type: string;
    avgScore: number;
    passRate: number;
    submissions: number;
  }[];
  scoreDistribution?: {
    range: string;
    count: number;
  }[];
  trendData?: {
    date: string;
    avgScore: number;
    submissions: number;
  }[];
  selectedFilters: {
    squadron: string;
    assessmentType: string;
    dateRange: string;
  };
}) {
  try {
    let promptContent = "";
    let systemContent = "You are an expert analytics assistant for a military loadmaster training application. Your task is to analyze performance data and provide actionable insights.";
    
    // Base stats to include in all prompts
    const baseStats = `
Overall Statistics:
- Total Students: ${data.overallStats.totalStudents}
- Total Submissions: ${data.overallStats.totalSubmissions}
- Average Score: ${data.overallStats.avgScore.toFixed(1)}%
- Pass Rate: ${data.overallStats.passRate.toFixed(1)}%

Applied Filters:
- Squadron: ${data.selectedFilters.squadron === 'all' ? 'All Squadrons' : data.selectedFilters.squadron}
- Assessment Type: ${data.selectedFilters.assessmentType === 'all' ? 'All Types' : data.selectedFilters.assessmentType}
- Date Range: ${data.selectedFilters.dateRange === 'all' ? 'All Time' : data.selectedFilters.dateRange}
`;

    // Generate different prompts based on analysis type
    switch (data.analysisType) {
      case "squadron":
        promptContent = `
Please analyze the squadron performance data and provide strategic insights on how different squadrons are performing:
${baseStats}

Squadron Performance:
${data.squadronData?.map(squad => 
  `- ${squad.squadron}: ${squad.avgScore.toFixed(1)}% avg score, ${squad.passRate.toFixed(1)}% pass rate, ${squad.submissions} submissions`
).join('\n') || 'No squadron data available'}

What insights can you provide about the relative performance of different squadrons? Identify top performers, areas of concern, and potential reasons for any significant differences. Provide specific recommendations tailored to each squadron's performance profile.
`;
        break;
        
      case "assessment":
        promptContent = `
Please analyze the assessment type performance data and provide insights on how students perform across different assessment formats:
${baseStats}

Assessment Type Performance:
${data.assessmentTypeData?.map(type => 
  `- ${type.type}: ${type.avgScore.toFixed(1)}% avg score, ${type.passRate.toFixed(1)}% pass rate, ${type.submissions} submissions`
).join('\n') || 'No assessment type data available'}

What insights can you provide about student performance across different assessment types? Are there particular assessment formats where students excel or struggle? What might explain these differences, and how can instructors leverage this information to improve training effectiveness?
`;
        break;
        
      case "trends":
        promptContent = `
Please analyze the performance trend data and provide insights on how performance has changed over time:
${baseStats}

Performance Trends:
${data.trendData?.map(point => 
  `- ${point.date}: ${point.avgScore.toFixed(1)}% avg score, ${point.submissions} submissions`
).join('\n') || 'No trend data available'}

What patterns or trends do you observe in the performance data over time? Are there improvements, declines, or cyclical patterns? What factors might explain these trends, and what recommendations would you make to maintain positive trends or address concerning ones?
`;
        break;
        
      case "scores":
        promptContent = `
Please analyze the score distribution data and provide insights on the overall pattern of student performance:
${baseStats}

Score Distribution:
${data.scoreDistribution?.map(item => 
  `- ${item.range}: ${item.count} students`
).join('\n') || 'No score distribution data available'}

What insights can you provide based on the score distribution? Is there a healthy spread of scores or concerning clustering? What does this distribution suggest about the difficulty level of assessments and student preparedness? What interventions might be appropriate based on this distribution?
`;
        break;
        
      default: // overall analysis
        promptContent = `
Please provide a comprehensive analysis of the current training performance data:
${baseStats}

${data.squadronData ? `Squadron Performance:
${data.squadronData.map(squad => 
  `- ${squad.squadron}: ${squad.avgScore.toFixed(1)}% avg score, ${squad.passRate.toFixed(1)}% pass rate, ${squad.submissions} submissions`
).join('\n')}
` : ''}

${data.assessmentTypeData ? `Assessment Type Performance:
${data.assessmentTypeData.map(type => 
  `- ${type.type}: ${type.avgScore.toFixed(1)}% avg score, ${type.passRate.toFixed(1)}% pass rate, ${type.submissions} submissions`
).join('\n')}
` : ''}

${data.scoreDistribution ? `Score Distribution:
${data.scoreDistribution.map(item => 
  `- ${item.range}: ${item.count} students`
).join('\n')}
` : ''}

What are the most significant insights from this data? What strengths and weaknesses can be identified in the current training program? What specific recommendations would you make to instructors to improve overall performance?
`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: promptContent }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    return response.choices[0].message.content || "No analysis available";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Unable to generate advanced analytics insights at this time. Please try again later.";
  }
}