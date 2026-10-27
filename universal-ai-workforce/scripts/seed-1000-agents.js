/**
 * Universal AI Workforce - 1,000+ Agents Seeder & Memory Profiler
 * Provisions 1,000 realistic logical agents across all 12 company departments.
 */

import { globalAgentRegistry } from '../core/agent-factory/agent-registry.js';
import { globalAgentFactory } from '../core/agent-factory/agent-factory.js';
import { globalOrganizationHierarchy } from '../core/orchestrator/hierarchy.js';
import { saveWorkforceState } from '../core/index.js';

const DEPARTMENTS = [
  'operations', 'engineering', 'sales', 'marketing', 'finance', 'hr',
  'support', 'legal', 'research', 'product_design', 'supply_chain', 'cybersecurity'
];

const ROLES_BY_DEPT = {
  operations: ['Operations Director', 'Agile Scrum Master', 'Workflow Automation Lead', 'Logistics Analyst', 'Process Optimizer'],
  engineering: ['Staff Software Architect', 'Senior Fullstack Engineer', 'DevOps Automator', 'AI Prompt Engineer', 'Microservices Lead', 'QA Specialist'],
  sales: ['Enterprise Account Executive', 'Sales Development Rep', 'Outreach Specialist', 'Proposal Writer', 'Pipeline Intelligence Lead'],
  marketing: ['Head of Growth', 'SEO/AEO Specialist', 'Copywriting Lead', 'Paid Ads Optimizer', 'Brand Strategist', 'Content Creator'],
  finance: ['Finance Director', 'Treasury Analyst', 'Invoice Auditor', 'Financial Modeler', 'Tax Compliance Officer'],
  hr: ['People Ops Lead', 'Technical Recruiter', 'Talent Onboarding Specialist', 'Culture Coordinator', 'Compensation Analyst'],
  support: ['Customer Success Lead', 'Tier 2 Support Specialist', 'Ticket Triage Agent', 'Knowledge Base Editor', 'CSAT Analyst'],
  legal: ['Chief Legal Counsel', 'Compliance Officer', 'Contract Reviewer', 'Data Privacy Officer', 'IP Specialist'],
  research: ['Director of Research', 'Competitive Intelligence Analyst', 'Data Scientist', 'Market Trend Forecaster'],
  product_design: ['Head of Product', 'Lead UI/UX Designer', 'Design System Architect', 'User Researcher', 'Product Owner'],
  supply_chain: ['Head of Supply Chain', 'Procurement Specialist', 'Warehouse Operations Lead', 'Supplier Risk Analyst'],
  cybersecurity: ['Head of Cyber Security', 'DevSecOps Sentinel', 'Bug Bounty Hunter', 'Cloud Security Architect', 'Incident Response Lead']
};

const CAPABILITY_BANK = [
  'api_development', 'code_review', 'seo_optimization', 'aeo_markup', 'vulnerability_scan',
  'secret_detection', 'financial_modeling', 'invoice_audit', 'contract_review', 'gdpr_compliance',
  'lead_generation', 'cold_outreach', 'ticket_triage', 'customer_retention', 'process_automation',
  'data_analysis', 'ui_wireframing', 'design_tokens', 'supply_chain_optimization', 'penetration_testing'
];

export async function seed1000Agents(count = 1000) {
  const startHeap = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  console.log(`\n🌱 Seeding ${count} logical AI employees across 12 departments...`);

  for (let i = 1; i <= count; i++) {
    const deptId = DEPARTMENTS[i % DEPARTMENTS.length];
    const roleList = ROLES_BY_DEPT[deptId];
    const jobTitle = roleList[i % roleList.length];
    const cap1 = CAPABILITY_BANK[i % CAPABILITY_BANK.length];
    const cap2 = CAPABILITY_BANK[(i * 3) % CAPABILITY_BANK.length];

    globalAgentFactory.createAgent({
      id: `agt_emp_${String(i).padStart(4, '0')}`,
      name: `${jobTitle} #${i}`,
      roleId: `role_${deptId}_${i % 10}`,
      jobTitle,
      departmentId: deptId,
      reportingManagerId: `mgr_${deptId}`,
      level: i % 10 === 0 ? 'manager' : (i % 5 === 0 ? 'team_lead' : 'specialist'),
      capabilities: [cap1, cap2],
      skills: [`skill_${cap1}`],
      budgetLimitUsd: 150.0 + (i % 50) * 10
    });
  }

  const elapsedMs = Date.now() - startTime;
  const endHeap = process.memoryUsage().heapUsed;
  const heapDiffMb = Math.round((endHeap - startHeap) / (1024 * 1024) * 100) / 100;

  console.log(`✅ Successfully seeded ${count} logical agents in ${elapsedMs}ms.`);
  console.log(`   Memory footprint: ~${heapDiffMb} MB heap allocated.`);
  console.log(`   Registry total agents: ${globalAgentRegistry.count()}\n`);

  await saveWorkforceState();
  return { count, elapsedMs, heapDiffMb };
}

if (process.argv[1] && process.argv[1].endsWith('seed-1000-agents.js')) {
  seed1000Agents(1000).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
