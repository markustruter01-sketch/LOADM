export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'performance' | 'training' | 'qualification' | 'readiness' | 'safety' | 'question' | 'workforce';
  title: string;
  body: string;
  action?: string;
}

const PASS_THRESHOLD = 70;
const FAIL_RATIO_TRIGGER = 0.30;
const SQUADRON_SPREAD_TRIGGER = 15;
const TREND_DECLINE_PERIODS = 3;
const MASTERY_MIN = 60;
const QUESTION_SUCCESS_MIN = 40;
const READINESS_TARGET = 85;
const SQUADRON_READINESS_GAP = 10;
const SAFETY_SCORE_MIN = 80;
const AVG_HOURS_MIN = 5;
const NIGHT_RATIO_MIN = 0.15;
const FORECAST_PEAK_TRIGGER = 5;
const EXPIRED_QUAL_CRITICAL = 3;
const AT_RISK_PERSONNEL_RATIO = 0.10;

export function recommendScoreDistribution(
  scoreDistribution: Array<{ range: string; count: number }>,
  passThreshold: number = PASS_THRESHOLD
): Recommendation[] {
  if (!scoreDistribution || scoreDistribution.length === 0) return [];

  const total = scoreDistribution.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return [];

  const failRanges = scoreDistribution.filter(d => {
    const match = d.range.match(/^(\d+)/);
    return match && parseInt(match[1]) < passThreshold;
  });
  const failCount = failRanges.reduce((sum, d) => sum + d.count, 0);
  const failRatio = failCount / total;

  const results: Recommendation[] = [];

  if (failRatio > 0.5) {
    results.push({
      priority: 'critical',
      category: 'performance',
      title: 'Majority of students scoring below passing threshold',
      body: `${Math.round(failRatio * 100)}% of students (${failCount} of ${total}) scored below ${passThreshold}%. This indicates a systemic training gap that requires immediate review of instructional content and delivery methods.`,
      action: 'Schedule an urgent review of curriculum materials and consider supplementary training sessions for underperforming cohorts.'
    });
  } else if (failRatio > FAIL_RATIO_TRIGGER) {
    results.push({
      priority: 'high',
      category: 'performance',
      title: 'Significant portion of students below passing threshold',
      body: `${Math.round(failRatio * 100)}% of students (${failCount} of ${total}) scored below ${passThreshold}%. This exceeds the acceptable ${Math.round(FAIL_RATIO_TRIGGER * 100)}% threshold.`,
      action: 'Review recent assessment results to identify common weak areas and schedule targeted remediation sessions.'
    });
  }

  const lowestRange = scoreDistribution.find(d => d.range.startsWith('0'));
  if (lowestRange && lowestRange.count > 0 && (lowestRange.count / total) > 0.1) {
    results.push({
      priority: 'high',
      category: 'performance',
      title: `${lowestRange.count} student${lowestRange.count > 1 ? 's' : ''} scoring in the lowest range`,
      body: `${lowestRange.count} student${lowestRange.count > 1 ? 's' : ''} scored in the ${lowestRange.range} range, indicating severe comprehension gaps that need immediate instructor attention.`,
      action: 'Identify these students individually and assign one-on-one mentoring or prerequisite review.'
    });
  }

  return results;
}

export function recommendSquadronPerformance(
  squadronData: Array<{ squadron: string; avgScore: number; passRate: number; submissions: number }>
): Recommendation[] {
  if (!squadronData || squadronData.length < 2) return [];

  const withSubs = squadronData.filter(s => s.submissions > 0);
  if (withSubs.length < 2) return [];

  const sorted = [...withSubs].sort((a, b) => b.avgScore - a.avgScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const spread = best.avgScore - worst.avgScore;

  const results: Recommendation[] = [];

  if (spread > SQUADRON_SPREAD_TRIGGER * 2) {
    results.push({
      priority: 'critical',
      category: 'performance',
      title: `${worst.squadron} trailing significantly — ${Math.round(spread)}pt gap`,
      body: `${worst.squadron} averages ${Math.round(worst.avgScore)}% compared to ${best.squadron} at ${Math.round(best.avgScore)}%. A ${Math.round(spread)}-point gap indicates a fundamental training disparity between squadrons.`,
      action: `Investigate training delivery differences between ${best.squadron} and ${worst.squadron}. Consider cross-squadron instructor rotation or resource sharing.`
    });
  } else if (spread > SQUADRON_SPREAD_TRIGGER) {
    results.push({
      priority: 'high',
      category: 'performance',
      title: `Performance gap between squadrons: ${Math.round(spread)}pts`,
      body: `${worst.squadron} (${Math.round(worst.avgScore)}%) is ${Math.round(spread)} points behind ${best.squadron} (${Math.round(best.avgScore)}%). This exceeds the ${SQUADRON_SPREAD_TRIGGER}-point acceptable variance.`,
      action: `Review ${worst.squadron}'s training schedule, instructor assignments, and resource access for discrepancies.`
    });
  }

  for (const sq of withSubs) {
    if (sq.passRate < 50) {
      results.push({
        priority: 'critical',
        category: 'performance',
        title: `${sq.squadron} pass rate critically low at ${Math.round(sq.passRate)}%`,
        body: `More than half of ${sq.squadron}'s ${sq.submissions} submissions are failing (score <${PASS_THRESHOLD}%). This squadron needs immediate intervention.`,
        action: `Assign additional instructor support to ${sq.squadron} and review their training programme.`
      });
    } else if (sq.passRate < PASS_THRESHOLD) {
      results.push({
        priority: 'high',
        category: 'performance',
        title: `${sq.squadron} pass rate below target at ${Math.round(sq.passRate)}%`,
        body: `${sq.squadron} has a ${Math.round(sq.passRate)}% pass rate across ${sq.submissions} submissions. Target is ${PASS_THRESHOLD}%.`,
        action: `Schedule targeted revision sessions for ${sq.squadron} personnel.`
      });
    }
  }

  return results;
}

export function recommendPerformanceTrends(
  trendData: Array<{ date: string; avgScore: number; submissions: number }>
): Recommendation[] {
  if (!trendData || trendData.length < TREND_DECLINE_PERIODS) return [];

  const recent = trendData.slice(-TREND_DECLINE_PERIODS);
  let declining = true;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].avgScore >= recent[i - 1].avgScore) {
      declining = false;
      break;
    }
  }

  const results: Recommendation[] = [];

  if (declining) {
    const drop = recent[0].avgScore - recent[recent.length - 1].avgScore;
    const priority = drop > 10 ? 'critical' : drop > 5 ? 'high' : 'medium';
    results.push({
      priority,
      category: 'performance',
      title: `Performance declining over last ${TREND_DECLINE_PERIODS} periods`,
      body: `Average score has dropped ${Math.round(drop)} points over the last ${TREND_DECLINE_PERIODS} assessment periods (from ${Math.round(recent[0].avgScore)}% to ${Math.round(recent[recent.length - 1].avgScore)}%). A sustained decline requires investigation.`,
      action: 'Analyse recent curriculum changes, instructor availability, and student workload for contributing factors.'
    });
  }

  const lastPeriod = trendData[trendData.length - 1];
  if (lastPeriod.avgScore < PASS_THRESHOLD) {
    results.push({
      priority: 'high',
      category: 'performance',
      title: `Current period average (${Math.round(lastPeriod.avgScore)}%) below passing threshold`,
      body: `The most recent period's average score of ${Math.round(lastPeriod.avgScore)}% is below the ${PASS_THRESHOLD}% passing threshold. This is an immediate concern.`,
      action: 'Review the most recent assessments for difficulty calibration and ensure students have adequate preparation time.'
    });
  }

  return results;
}

export function recommendAssessmentTypes(
  assessmentTypeData: Array<{ type: string; avgScore: number; passRate: number; submissions: number }>
): Recommendation[] {
  if (!assessmentTypeData || assessmentTypeData.length === 0) return [];

  const results: Recommendation[] = [];

  for (const item of assessmentTypeData) {
    if (item.submissions === 0) continue;

    if (item.passRate < 50) {
      results.push({
        priority: 'critical',
        category: 'training',
        title: `${item.type} assessments: critically low pass rate (${Math.round(item.passRate)}%)`,
        body: `${item.type} assessments have a ${Math.round(item.passRate)}% pass rate across ${item.submissions} submissions with an average score of ${Math.round(item.avgScore)}%. More than half of students are failing this assessment type.`,
        action: `Immediately review ${item.type} assessment content and delivery. Consider whether the assessment format matches the training approach.`
      });
    } else if (item.passRate < PASS_THRESHOLD) {
      results.push({
        priority: 'high',
        category: 'training',
        title: `${item.type} assessments below target pass rate`,
        body: `${item.type} assessments have a ${Math.round(item.passRate)}% pass rate (target: ${PASS_THRESHOLD}%) across ${item.submissions} submissions.`,
        action: `Review ${item.type} assessment calibration and consider providing additional practice materials for this format.`
      });
    }
  }

  return results;
}

export function recommendTopicMastery(
  topicMasteryData: Array<{ topic: string; masteryLevel: number }>
): Recommendation[] {
  if (!topicMasteryData || topicMasteryData.length === 0) return [];

  const results: Recommendation[] = [];
  const weak = topicMasteryData.filter(t => t.masteryLevel < MASTERY_MIN);
  const critical = topicMasteryData.filter(t => t.masteryLevel < 40);

  for (const topic of critical) {
    results.push({
      priority: 'critical',
      category: 'training',
      title: `Critical gap: ${topic.topic} at ${Math.round(topic.masteryLevel)}% mastery`,
      body: `${topic.topic} has critically low mastery at ${Math.round(topic.masteryLevel)}%. This category requires urgent curriculum review and supplementary training resources.`,
      action: `Develop targeted training materials for ${topic.topic} and schedule mandatory revision sessions.`
    });
  }

  for (const topic of weak) {
    if (topic.masteryLevel >= 40) {
      results.push({
        priority: 'high',
        category: 'training',
        title: `Below standard: ${topic.topic} at ${Math.round(topic.masteryLevel)}% mastery`,
        body: `${topic.topic} mastery is ${Math.round(topic.masteryLevel)}%, below the ${MASTERY_MIN}% minimum standard. Students may lack foundational knowledge in this area.`,
        action: `Incorporate additional ${topic.topic} content into upcoming training cycles.`
      });
    }
  }

  if (weak.length > topicMasteryData.length / 2 && topicMasteryData.length >= 4) {
    results.push({
      priority: 'critical',
      category: 'training',
      title: `Systemic training gap: ${weak.length} of ${topicMasteryData.length} topics below standard`,
      body: `More than half of all topic categories are below the ${MASTERY_MIN}% mastery threshold. This suggests a broad curriculum or instructional effectiveness issue rather than isolated topic weakness.`,
      action: 'Conduct a comprehensive curriculum review and assess instructor delivery methods across all topics.'
    });
  }

  return results;
}

export function recommendQuestionDifficulty(
  questionDifficultyData: Array<{ questionText: string; successRate: number; totalAttempts: number }>
): Recommendation[] {
  if (!questionDifficultyData || questionDifficultyData.length === 0) return [];

  const results: Recommendation[] = [];
  const hardQuestions = questionDifficultyData.filter(q => q.successRate < QUESTION_SUCCESS_MIN && q.totalAttempts >= 3);

  if (hardQuestions.length === 0) return [];

  const veryHard = hardQuestions.filter(q => q.successRate < 20);
  const moderatelyHard = hardQuestions.filter(q => q.successRate >= 20);

  for (const q of veryHard) {
    const truncated = q.questionText.length > 80 ? q.questionText.substring(0, 80) + '...' : q.questionText;
    results.push({
      priority: 'critical',
      category: 'question',
      title: `Question failing almost all students (${Math.round(q.successRate)}% success)`,
      body: `"${truncated}" — Only ${Math.round(q.successRate)}% of ${q.totalAttempts} attempts are correct. This may indicate an ambiguous question, incorrect answer key, or content not covered in training.`,
      action: 'Review this question for clarity, verify the correct answer, and check that the topic is adequately covered in the curriculum.'
    });
  }

  if (moderatelyHard.length > 0) {
    const topThree = moderatelyHard.slice(0, 3);
    const questionList = topThree.map(q => {
      const truncated = q.questionText.length > 60 ? q.questionText.substring(0, 60) + '...' : q.questionText;
      return `• "${truncated}" (${Math.round(q.successRate)}% success, ${q.totalAttempts} attempts)`;
    }).join('\n');

    results.push({
      priority: 'high',
      category: 'question',
      title: `${moderatelyHard.length} question${moderatelyHard.length > 1 ? 's' : ''} with low success rates`,
      body: `The following questions have success rates below ${QUESTION_SUCCESS_MIN}%:\n${questionList}`,
      action: 'Consider rewording these questions for clarity or reviewing the associated training material.'
    });
  }

  return results;
}

export function recommendAtRiskStudents(
  atRiskData: Array<{ userId: number; name: string; squadron: string; riskLevel: string; riskFactors: string[]; avgQuizScore?: number; avgScenarioScore?: number; daysSinceActivity?: number }>,
  certificationData: Array<{ userId: number; name: string; squadron: string; readinessScore: number; status: string }>
): Recommendation[] {
  if (!atRiskData && !certificationData) return [];

  const results: Recommendation[] = [];
  const highRisk = (atRiskData || []).filter(s => s.riskLevel === 'high');
  const mediumRisk = (atRiskData || []).filter(s => s.riskLevel === 'medium');

  if (highRisk.length > 0) {
    const studentList = highRisk.slice(0, 5).map(s => {
      const factors = s.riskFactors?.slice(0, 2).join(', ') || 'multiple risk factors';
      return `• ${s.name} (${s.squadron}) — ${factors}`;
    }).join('\n');

    results.push({
      priority: 'critical',
      category: 'workforce',
      title: `${highRisk.length} personnel at high risk`,
      body: `The following personnel require immediate instructor intervention:\n${studentList}${highRisk.length > 5 ? `\n...and ${highRisk.length - 5} more` : ''}`,
      action: 'Assign dedicated mentoring and schedule progress reviews within the next 7 days for each high-risk student.'
    });
  }

  if (mediumRisk.length > 3) {
    results.push({
      priority: 'high',
      category: 'workforce',
      title: `${mediumRisk.length} personnel at medium risk`,
      body: `${mediumRisk.length} students are flagged as medium risk. While not critical, this volume suggests emerging issues that should be addressed before they escalate.`,
      action: 'Review medium-risk students during the next training cycle and implement early intervention strategies.'
    });
  }

  if (certificationData && certificationData.length > 0) {
    const notReady = certificationData.filter(s => s.status === 'not-ready');
    if (notReady.length > 0) {
      const ratio = notReady.length / certificationData.length;
      if (ratio > 0.3) {
        results.push({
          priority: 'high',
          category: 'readiness',
          title: `${Math.round(ratio * 100)}% of personnel not certification-ready`,
          body: `${notReady.length} of ${certificationData.length} tracked personnel have a "not ready" certification status. This impacts overall squadron readiness.`,
          action: 'Prioritise certification pathway completion for not-ready personnel in upcoming training schedules.'
        });
      }
    }
  }

  return results;
}

export function recommendWorkforceReadiness(
  readinessData: {
    summary: { total: number; ready: number; notReady: number; readyPercent: number };
    reasonBreakdown: Array<{ reason: string; count: number; percent: number }>;
    bySquadron: Array<{ squadron: string; total: number; ready: number; notReady: number; readyPercent: number }>;
  },
  currencyData: {
    summary: { total: number; expired: number; expiring30Days: number; personnelWithExpiredQuals: number; personnelAtRisk: number };
  }
): Recommendation[] {
  if (!readinessData) return [];

  const results: Recommendation[] = [];
  const readyPct = readinessData.summary.readyPercent;

  if (readyPct < 70) {
    results.push({
      priority: 'critical',
      category: 'readiness',
      title: `Workforce readiness critically low at ${Math.round(readyPct)}%`,
      body: `Only ${readinessData.summary.ready} of ${readinessData.summary.total} personnel are flight-ready (${Math.round(readyPct)}%). The target is ${READINESS_TARGET}%. This represents a significant operational capability gap.`,
      action: 'Convene an urgent readiness review with all squadron leaders to identify and clear blockers.'
    });
  } else if (readyPct < READINESS_TARGET) {
    results.push({
      priority: 'high',
      category: 'readiness',
      title: `Workforce readiness below target: ${Math.round(readyPct)}%`,
      body: `Current readiness is ${Math.round(readyPct)}% against the ${READINESS_TARGET}% target. ${readinessData.summary.notReady} personnel are not flight-ready.`,
      action: 'Review non-readiness reasons and prioritise the most impactful blockers for resolution.'
    });
  }

  if (readinessData.reasonBreakdown && readinessData.reasonBreakdown.length > 0) {
    const topReason = readinessData.reasonBreakdown[0];
    if (topReason.count > 0 && readyPct < READINESS_TARGET) {
      results.push({
        priority: 'medium',
        category: 'readiness',
        title: `Top readiness blocker: ${topReason.reason}`,
        body: `"${topReason.reason}" is the leading cause of non-readiness, affecting ${topReason.count} personnel (${Math.round(topReason.percent)}% of all non-ready members).`,
        action: `Focus readiness recovery efforts on resolving "${topReason.reason}" issues first for maximum impact.`
      });
    }
  }

  if (currencyData && currencyData.summary.expired > 0) {
    results.push({
      priority: currencyData.summary.expired >= EXPIRED_QUAL_CRITICAL ? 'critical' : 'high',
      category: 'qualification',
      title: `${currencyData.summary.expired} expired qualification${currencyData.summary.expired > 1 ? 's' : ''} in the workforce`,
      body: `${currencyData.summary.personnelWithExpiredQuals} personnel have expired qualifications. Additionally, ${currencyData.summary.expiring30Days} qualifications are expiring within 30 days.`,
      action: 'Schedule renewal assessments for affected personnel immediately and ensure upcoming expirations are tracked.'
    });
  }

  return results;
}

export function recommendSquadronReadiness(
  readinessData: {
    bySquadron: Array<{ squadron: string; total: number; ready: number; notReady: number; readyPercent: number; reasonBreakdown?: Array<{ reason: string; count: number }> }>;
  }
): Recommendation[] {
  if (!readinessData?.bySquadron) return [];

  const results: Recommendation[] = [];

  for (const sq of readinessData.bySquadron) {
    if (sq.total === 0) continue;
    const gap = READINESS_TARGET - sq.readyPercent;

    if (gap > SQUADRON_READINESS_GAP * 2) {
      const topReason = sq.reasonBreakdown?.[0];
      results.push({
        priority: 'critical',
        category: 'readiness',
        title: `${sq.squadron} readiness critically low at ${Math.round(sq.readyPercent)}%`,
        body: `${sq.squadron} has ${sq.ready} of ${sq.total} personnel flight-ready (${Math.round(sq.readyPercent)}%), ${Math.round(gap)} points below the ${READINESS_TARGET}% target.${topReason ? ` Primary blocker: "${topReason.reason}" (${topReason.count} personnel).` : ''}`,
        action: `Engage ${sq.squadron} leadership to develop an accelerated readiness recovery plan.`
      });
    } else if (gap > SQUADRON_READINESS_GAP) {
      results.push({
        priority: 'high',
        category: 'readiness',
        title: `${sq.squadron} below readiness target by ${Math.round(gap)} points`,
        body: `${sq.squadron} is at ${Math.round(sq.readyPercent)}% readiness (${sq.ready}/${sq.total} ready). Target is ${READINESS_TARGET}%.`,
        action: `Review ${sq.squadron}'s non-readiness breakdown and prioritise the top blockers.`
      });
    }
  }

  return results;
}

export function recommendFlightOperations(
  flightData: {
    summary: { totalNightHours: number; totalDayHours: number; totalFlights: number; uniqueUsers: number; avgHoursPerPerson: number };
    bySquadron?: Array<{ squadron: string; totalHours: number; avgHoursPerMember: number }>;
  },
  totalPersonnel: number
): Recommendation[] {
  if (!flightData) return [];

  const results: Recommendation[] = [];
  const { totalNightHours, totalDayHours, avgHoursPerPerson } = flightData.summary;
  const totalHours = totalNightHours + totalDayHours;

  if (avgHoursPerPerson < AVG_HOURS_MIN && totalPersonnel > 0) {
    results.push({
      priority: 'high',
      category: 'workforce',
      title: `Low average flight hours: ${avgHoursPerPerson.toFixed(1)} hrs/person`,
      body: `Average flight hours per person is ${avgHoursPerPerson.toFixed(1)}, below the ${AVG_HOURS_MIN}-hour minimum. Low flight hours impact proficiency currency and operational readiness.`,
      action: 'Review flight scheduling to ensure equitable distribution of flying hours across personnel.'
    });
  }

  if (totalHours > 0) {
    const nightRatio = totalNightHours / totalHours;
    if (nightRatio < NIGHT_RATIO_MIN) {
      results.push({
        priority: 'medium',
        category: 'workforce',
        title: `Night flying ratio below standard: ${Math.round(nightRatio * 100)}%`,
        body: `Night operations account for only ${Math.round(nightRatio * 100)}% of total flight hours (${totalNightHours.toFixed(1)} of ${totalHours.toFixed(1)} hrs). Minimum expected ratio is ${Math.round(NIGHT_RATIO_MIN * 100)}%.`,
        action: 'Increase night flying allocations in upcoming flight schedules to maintain night proficiency currency.'
      });
    }
  }

  if (flightData.bySquadron && flightData.bySquadron.length >= 2) {
    const sorted = [...flightData.bySquadron].sort((a, b) => a.avgHoursPerMember - b.avgHoursPerMember);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    if (highest.avgHoursPerMember > 0 && lowest.avgHoursPerMember < highest.avgHoursPerMember * 0.5) {
      results.push({
        priority: 'medium',
        category: 'workforce',
        title: `Flight hour disparity: ${lowest.squadron} significantly behind`,
        body: `${lowest.squadron} averages ${lowest.avgHoursPerMember.toFixed(1)} hrs/member compared to ${highest.squadron} at ${highest.avgHoursPerMember.toFixed(1)} hrs/member. This disparity may affect operational capability.`,
        action: `Rebalance flight scheduling to provide more hours to ${lowest.squadron} personnel.`
      });
    }
  }

  return results;
}

export function recommendSafetyCompliance(
  safetyData: {
    summary: { total: number; incident: number; observation: number };
    bySeverity: { minor: number; moderate: number; major: number };
    byStatus: { open: number; reviewed: number; closed: number };
    safetyScore: number;
    safetyScoreLabel: string;
    openItems?: Array<{ type: string; severity: string; squadron: string }>;
  }
): Recommendation[] {
  if (!safetyData) return [];

  const results: Recommendation[] = [];

  if (safetyData.bySeverity.major > 0) {
    results.push({
      priority: 'critical',
      category: 'safety',
      title: `${safetyData.bySeverity.major} major safety incident${safetyData.bySeverity.major > 1 ? 's' : ''} recorded`,
      body: `There ${safetyData.bySeverity.major === 1 ? 'is' : 'are'} ${safetyData.bySeverity.major} major-severity safety incident${safetyData.bySeverity.major > 1 ? 's' : ''} on record. Major incidents require immediate command attention and may necessitate a safety stand-down.`,
      action: 'Review all major incidents immediately. Consider a safety stand-down or targeted safety briefing if incidents are recent.'
    });
  }

  if (safetyData.byStatus.open > 0) {
    results.push({
      priority: safetyData.byStatus.open > 3 ? 'high' : 'medium',
      category: 'safety',
      title: `${safetyData.byStatus.open} open safety item${safetyData.byStatus.open > 1 ? 's' : ''} pending review`,
      body: `${safetyData.byStatus.open} safety records remain open. Unresolved safety items represent ongoing risk and should be reviewed and closed promptly.`,
      action: 'Prioritise open safety items for review and assign responsible officers for resolution.'
    });
  }

  if (safetyData.safetyScore < 60) {
    results.push({
      priority: 'critical',
      category: 'safety',
      title: `Safety score critically low: ${safetyData.safetyScore}/100`,
      body: `The workforce safety score is ${safetyData.safetyScore}/100 (${safetyData.safetyScoreLabel}). A score below 60 indicates significant safety culture concerns requiring command-level intervention.`,
      action: 'Initiate a comprehensive safety review. Consider mandatory safety briefings and increased supervision for high-risk activities.'
    });
  } else if (safetyData.safetyScore < SAFETY_SCORE_MIN) {
    results.push({
      priority: 'high',
      category: 'safety',
      title: `Safety score below standard: ${safetyData.safetyScore}/100`,
      body: `The safety score is ${safetyData.safetyScore}/100 (${safetyData.safetyScoreLabel}), below the ${SAFETY_SCORE_MIN}-point target. This suggests emerging safety trends that should be addressed proactively.`,
      action: 'Review recent safety records and reinforce safety protocols in upcoming training sessions.'
    });
  }

  return results;
}

export function recommendQualificationForecast(
  forecastData: {
    forecast: Array<{ month: string; monthLabel: string; expiringThisMonth: number; personnelAffected: number; cumulativeExpired: number }>;
    summary: { totalExpiringQuals: number; totalPersonnelAffected: number; peakMonth: { monthLabel?: string; expiringThisMonth?: number } | null };
    criticalAlerts: Array<{ month: string; alert: string }>;
    recommendations: string[];
  },
  currencyData: {
    summary: { expired: number; expiring30Days: number; expiring60Days: number; personnelWithExpiredQuals: number; personnelAtRisk: number; total: number };
  },
  readinessData: {
    summary: { total: number; readyPercent: number };
  }
): Recommendation[] {
  if (!forecastData) return [];

  const results: Recommendation[] = [];

  if (currencyData?.summary.expired > 0) {
    results.push({
      priority: 'critical',
      category: 'qualification',
      title: `${currencyData.summary.expired} qualifications already expired`,
      body: `${currencyData.summary.personnelWithExpiredQuals} personnel currently have expired qualifications. These individuals may be non-deployable until renewed.`,
      action: 'Schedule immediate renewal assessments for all personnel with expired qualifications.'
    });
  }

  if (currencyData?.summary.expiring30Days > 0) {
    results.push({
      priority: 'high',
      category: 'qualification',
      title: `${currencyData.summary.expiring30Days} qualifications expiring within 30 days`,
      body: `${currencyData.summary.expiring30Days} qualifications will expire within the next 30 days. Proactive renewal will prevent these from adding to the expired count.`,
      action: 'Contact affected personnel and schedule renewal assessments before expiry dates.'
    });
  }

  if (forecastData.summary.peakMonth && forecastData.summary.peakMonth.expiringThisMonth && forecastData.summary.peakMonth.expiringThisMonth >= FORECAST_PEAK_TRIGGER) {
    results.push({
      priority: 'high',
      category: 'qualification',
      title: `Peak expiry month: ${forecastData.summary.peakMonth.monthLabel} (${forecastData.summary.peakMonth.expiringThisMonth} quals)`,
      body: `${forecastData.summary.peakMonth.monthLabel} will see ${forecastData.summary.peakMonth.expiringThisMonth} qualifications expire — the highest in the 6-month forecast. Planning renewals now will prevent a readiness dip.`,
      action: `Begin scheduling renewal assessments for ${forecastData.summary.peakMonth.monthLabel} expirations now to spread the workload.`
    });
  }

  if (currencyData && readinessData) {
    const expiredRatio = currencyData.summary.expired / Math.max(currencyData.summary.total, 1);
    if (expiredRatio > AT_RISK_PERSONNEL_RATIO && readinessData.summary.readyPercent < READINESS_TARGET) {
      results.push({
        priority: 'critical',
        category: 'readiness',
        title: 'Expired qualifications driving readiness below target',
        body: `${Math.round(expiredRatio * 100)}% of tracked qualifications are expired, and workforce readiness is at ${Math.round(readinessData.summary.readyPercent)}%. There is a direct correlation between qualification currency and operational readiness.`,
        action: 'Prioritise qualification renewals as the primary lever for improving workforce readiness.'
      });
    }
  }

  for (const alert of forecastData.criticalAlerts || []) {
    results.push({
      priority: 'medium',
      category: 'qualification',
      title: `Forecast alert: ${alert.month}`,
      body: alert.alert,
    });
  }

  return results;
}
