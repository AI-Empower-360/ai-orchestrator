/**
 * Test script for agentic AI architecture
 * Tests rule-based generation without requiring OpenAI API key
 */

const testCases = [
  {
    name: 'Chest Pain Case',
    transcription: 'Patient presents with chest pain and shortness of breath. Vital signs: BP 140/90, HR 95. Assessment: Possible cardiac event. Plan: Order EKG and cardiac enzymes.',
    expectedSOAP: {
      hasSubjective: true,
      hasObjective: true,
      hasAssessment: true,
      hasPlan: true,
    },
    expectedAlerts: {
      hasCritical: true, // Should detect chest pain (critical alerts stop further checking)
      hasWarning: false, // Critical alert found first, so warning won't be checked
    },
  },
  {
    name: 'Fever Case',
    transcription: 'Patient reports fever and chills for 3 days. Temperature 101.2F. Assessment: Possible infection. Plan: Order CBC and blood cultures.',
    expectedSOAP: {
      hasSubjective: true,
      hasObjective: true,
      hasAssessment: true,
      hasPlan: true,
    },
    expectedAlerts: {
      hasWarning: true, // Should detect fever
    },
  },
  {
    name: 'Routine Visit',
    transcription: 'Patient reports feeling well. Vital signs stable. Assessment: Healthy. Plan: Continue current medications.',
    expectedSOAP: {
      hasSubjective: true,
      hasObjective: true,
      hasAssessment: true,
      hasPlan: true,
    },
    expectedAlerts: {
      hasInfo: true, // Should generate info alert
    },
  },
];

console.log('🧪 Testing Agentic AI Architecture (Rule-Based Mode)\n');
console.log('=' .repeat(60));

// Mock rule-based SOAP generation
function generateRuleBasedSOAP(transcriptionText) {
  const lowerText = transcriptionText.toLowerCase();
  const lines = transcriptionText.split(/[.!?]\s+/).filter(line => line.trim().length > 0);

  const subjectiveKeywords = ['patient', 'reports', 'complains', 'states', 'feels', 'symptoms', 'history'];
  const subjectiveLines = lines.filter(line => 
    subjectiveKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  const subjective = subjectiveLines.length > 0 
    ? subjectiveLines.join('. ') 
    : (transcriptionText.includes('patient') || transcriptionText.includes('reports')
        ? transcriptionText
        : 'Patient information recorded from conversation');

  const objectiveKeywords = ['vital', 'bp', 'blood pressure', 'heart rate', 'temperature', 'exam', 'physical', 'observed', 'measured'];
  const objectiveLines = lines.filter(line => 
    objectiveKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  const objective = objectiveLines.length > 0
    ? objectiveLines.join('. ')
    : (lowerText.includes('vital') || lowerText.includes('bp') || lowerText.includes('blood pressure')
        ? 'Vital signs and physical findings mentioned in conversation'
        : 'Objective findings to be documented');

  const assessmentKeywords = ['diagnosis', 'assessment', 'evaluation', 'likely', 'possible', 'rule out', 'differential'];
  const assessmentLines = lines.filter(line => 
    assessmentKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  const assessment = assessmentLines.length > 0
    ? assessmentLines.join('. ')
    : (lowerText.includes('diagnosis') || lowerText.includes('assessment')
        ? transcriptionText
        : 'Clinical assessment based on presentation');

  const planKeywords = ['plan', 'order', 'prescribe', 'follow', 'treatment', 'medication', 'test', 'refer'];
  const planLines = lines.filter(line => 
    planKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  const plan = planLines.length > 0
    ? planLines.join('. ')
    : (lowerText.includes('plan') || lowerText.includes('order') || lowerText.includes('follow')
        ? transcriptionText
        : 'Treatment plan to be determined');

  return {
    subjective: subjective.trim() || 'Patient information recorded',
    objective: objective.trim() || 'Objective findings to be documented',
    assessment: assessment.trim() || 'Assessment pending',
    plan: plan.trim() || 'Plan to be determined',
  };
}

// Mock rule-based alert generation
function generateRuleBasedAlerts(transcriptionText) {
  const alerts = [];
  const lowerText = transcriptionText.toLowerCase();

  // Critical alerts
  const criticalKeywords = [
    { pattern: 'chest pain', message: 'Chest pain reported. Rule out cardiac event.' },
    { pattern: 'difficulty breathing', message: 'Difficulty breathing reported. Assess respiratory status immediately.' },
    { pattern: 'shortness of breath', message: 'Shortness of breath reported. Monitor oxygen saturation.' },
  ];

  for (const { pattern, message } of criticalKeywords) {
    if (lowerText.includes(pattern)) {
      alerts.push({
        severity: 'critical',
        message,
        category: 'symptoms',
      });
      break;
    }
  }

  // Warning alerts
  if (alerts.length === 0) {
    const warningKeywords = [
      { pattern: 'high blood pressure', message: 'Elevated blood pressure noted. Monitor and consider treatment.' },
      { pattern: 'fever', message: 'Fever reported. Monitor temperature and consider infection workup.' },
    ];

    for (const { pattern, message } of warningKeywords) {
      if (lowerText.includes(pattern) && alerts.length < 3) {
        alerts.push({
          severity: 'warning',
          message,
          category: 'clinical',
        });
      }
    }
  }

  // Info alerts
  if (alerts.length === 0) {
    alerts.push({
      severity: 'info',
      message: 'New clinical information recorded. Please review SOAP notes.',
      category: 'general',
    });
  }

  return alerts;
}

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(60));
  console.log(`Input: ${testCase.transcription.substring(0, 80)}...\n`);

  // Generate SOAP notes
  const soapNotes = generateRuleBasedSOAP(testCase.transcription);
  console.log('📝 Generated SOAP Notes:');
  console.log(`  Subjective: ${soapNotes.subjective.substring(0, 60)}...`);
  console.log(`  Objective: ${soapNotes.objective.substring(0, 60)}...`);
  console.log(`  Assessment: ${soapNotes.assessment.substring(0, 60)}...`);
  console.log(`  Plan: ${soapNotes.plan.substring(0, 60)}...`);

  // Generate alerts
  const alerts = generateRuleBasedAlerts(testCase.transcription);
  console.log(`\n🚨 Generated Alerts: ${alerts.length}`);
  alerts.forEach(alert => {
    console.log(`  [${alert.severity.toUpperCase()}] ${alert.message}`);
  });

  // Validate SOAP
  const soapValid = 
    (soapNotes.subjective && soapNotes.subjective.length > 0) === testCase.expectedSOAP.hasSubjective &&
    (soapNotes.objective && soapNotes.objective.length > 0) === testCase.expectedSOAP.hasObjective &&
    (soapNotes.assessment && soapNotes.assessment.length > 0) === testCase.expectedSOAP.hasAssessment &&
    (soapNotes.plan && soapNotes.plan.length > 0) === testCase.expectedSOAP.hasPlan;

  // Validate alerts
  const hasCritical = alerts.some(a => a.severity === 'critical');
  const hasWarning = alerts.some(a => a.severity === 'warning');
  const hasInfo = alerts.some(a => a.severity === 'info');

  const alertsValid = 
    (testCase.expectedAlerts.hasCritical ? hasCritical : !hasCritical) &&
    (testCase.expectedAlerts.hasWarning ? hasWarning : !hasWarning) &&
    (testCase.expectedAlerts.hasInfo ? hasInfo : !hasInfo);

  if (soapValid && alertsValid) {
    console.log('\n✅ Test PASSED');
    passed++;
  } else {
    console.log('\n❌ Test FAILED');
    if (!soapValid) console.log('  - SOAP notes validation failed');
    if (!alertsValid) console.log('  - Alerts validation failed');
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`\n${passed === testCases.length ? '✅ All tests passed!' : '❌ Some tests failed'}\n`);
