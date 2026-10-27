/**
 * Universal AI Workforce - Organization Hierarchy
 * Defines C-Suite, Departments, and dynamic restructuring operations.
 */

export class OrganizationHierarchy {
  constructor() {
    this.founder = {
      id: 'owner',
      title: 'Founder & Owner',
      reportsTo: null
    };

    this.ceo = {
      id: 'ceo',
      title: 'AI CEO',
      name: 'Central Executive Orchestrator',
      reportsTo: 'owner'
    };

    this.cSuite = new Map([
      ['coo', { id: 'coo', title: 'Chief Operating Officer', department: 'operations', reportsTo: 'ceo' }],
      ['cto', { id: 'cto', title: 'Chief Technology Officer', department: 'engineering', reportsTo: 'ceo' }],
      ['cfo', { id: 'cfo', title: 'Chief Financial Officer', department: 'finance', reportsTo: 'ceo' }],
      ['cmo', { id: 'cmo', title: 'Chief Marketing Officer', department: 'marketing', reportsTo: 'ceo' }],
      ['cro', { id: 'cro', title: 'Chief Revenue Officer', department: 'sales', reportsTo: 'ceo' }],
      ['chro', { id: 'chro', title: 'Chief Human Resources Officer', department: 'hr', reportsTo: 'ceo' }],
      ['ciso', { id: 'ciso', title: 'Chief Information Security Officer', department: 'cybersecurity', reportsTo: 'ceo' }],
      ['cos', { id: 'cos', title: 'Chief of Staff', department: 'executive_office', reportsTo: 'ceo' }]
    ]);

    this.departments = new Map([
      ['operations', { id: 'operations', name: 'Operations & Project Management', cSuiteLead: 'coo', active: true }],
      ['engineering', { id: 'engineering', name: 'Software & AI Engineering', cSuiteLead: 'cto', active: true }],
      ['sales', { id: 'sales', name: 'Sales & Business Development', cSuiteLead: 'cro', active: true }],
      ['marketing', { id: 'marketing', name: 'Marketing & Growth', cSuiteLead: 'cmo', active: true }],
      ['finance', { id: 'finance', name: 'Finance & Accounting', cSuiteLead: 'cfo', active: true }],
      ['hr', { id: 'hr', name: 'Human Resources & Recruitment', cSuiteLead: 'chro', active: true }],
      ['support', { id: 'support', name: 'Customer Support & Success', cSuiteLead: 'coo', active: true }],
      ['legal', { id: 'legal', name: 'Legal & Compliance Support', cSuiteLead: 'cos', active: true }],
      ['research', { id: 'research', name: 'Research & Business Intelligence', cSuiteLead: 'cto', active: true }],
      ['product_design', { id: 'product_design', name: 'Product & Design', cSuiteLead: 'cto', active: true }],
      ['supply_chain', { id: 'supply_chain', name: 'Procurement & Supply Chain', cSuiteLead: 'coo', active: true }],
      ['cybersecurity', { id: 'cybersecurity', name: 'Cyber Security & DevSecOps', cSuiteLead: 'ciso', active: true }]
    ]);
  }

  getDepartment(deptId) {
    return this.departments.get(deptId);
  }

  listDepartments() {
    return Array.from(this.departments.values());
  }

  addDepartment(deptData) {
    if (!deptData.id || !deptData.name) {
      throw new Error("Department must have 'id' and 'name'.");
    }
    const record = {
      id: deptData.id,
      name: deptData.name,
      cSuiteLead: deptData.cSuiteLead || 'coo',
      industry: deptData.industry || 'universal',
      active: true,
      createdAt: new Date().toISOString()
    };
    this.departments.set(deptData.id, record);
    return record;
  }

  renameDepartment(deptId, newName) {
    const dept = this.departments.get(deptId);
    if (!dept) throw new Error(`Department '${deptId}' not found.`);
    dept.name = newName;
    return dept;
  }

  removeDepartment(deptId) {
    const dept = this.departments.get(deptId);
    if (!dept) throw new Error(`Department '${deptId}' not found.`);
    dept.active = false;
    return dept;
  }

  mergeDepartments(sourceDeptId, targetDeptId, agentRegistry = null) {
    const sourceDept = this.departments.get(sourceDeptId);
    const targetDept = this.departments.get(targetDeptId);
    if (!sourceDept) throw new Error(`Source department '${sourceDeptId}' not found.`);
    if (!targetDept) throw new Error(`Target department '${targetDeptId}' not found.`);

    // Reassign all agents from source to target if agent registry provided
    let reassignedCount = 0;
    if (agentRegistry) {
      const sourceAgents = agentRegistry.findAgentsByDepartment(sourceDeptId);
      for (const agent of sourceAgents) {
        agent.departmentId = targetDeptId;
        agentRegistry.register(agent);
        reassignedCount++;
      }
    }

    sourceDept.active = false;
    sourceDept.mergedInto = targetDeptId;
    sourceDept.mergedAt = new Date().toISOString();

    return {
      success: true,
      sourceDeptId,
      targetDeptId,
      reassignedAgents: reassignedCount
    };
  }

  splitDepartment(deptId, deptAData, deptBData, agentRegistry = null, splitRule = null) {
    const originalDept = this.departments.get(deptId);
    if (!originalDept) throw new Error(`Department '${deptId}' not found.`);

    const deptA = this.addDepartment({
      id: deptAData.id,
      name: deptAData.name,
      cSuiteLead: deptAData.cSuiteLead || originalDept.cSuiteLead,
      industry: deptAData.industry || originalDept.industry
    });

    const deptB = this.addDepartment({
      id: deptBData.id,
      name: deptBData.name,
      cSuiteLead: deptBData.cSuiteLead || originalDept.cSuiteLead,
      industry: deptBData.industry || originalDept.industry
    });

    let assignedToA = 0;
    let assignedToB = 0;

    if (agentRegistry) {
      const agents = agentRegistry.findAgentsByDepartment(deptId);
      for (const agent of agents) {
        // Use custom splitRule or default 50/50 round-robin
        const targetDeptId = splitRule ? splitRule(agent) : ((assignedToA <= assignedToB) ? deptA.id : deptB.id);
        agent.departmentId = targetDeptId;
        agentRegistry.register(agent);
        if (targetDeptId === deptA.id) assignedToA++;
        else assignedToB++;
      }
    }

    originalDept.active = false;
    originalDept.splitInto = [deptA.id, deptB.id];
    originalDept.splitAt = new Date().toISOString();

    return {
      success: true,
      originalDeptId: deptId,
      createdDepartments: [deptA, deptB],
      distribution: { [deptA.id]: assignedToA, [deptB.id]: assignedToB }
    };
  }

  getStructureTree() {
    return {
      founder: this.founder,
      ceo: this.ceo,
      cSuite: Array.from(this.cSuite.values()),
      departments: this.listDepartments()
    };
  }
}

export const globalOrganizationHierarchy = new OrganizationHierarchy();
