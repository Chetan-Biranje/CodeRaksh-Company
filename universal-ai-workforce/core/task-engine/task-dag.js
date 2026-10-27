/**
 * Universal AI Workforce - Task DAG Engine
 * Dependency-aware directed acyclic graph with cycle detection and parallel batching.
 */

export class TaskDAG {
  constructor() {
    this.tasks = new Map(); // taskId -> taskObject
    this.edges = new Map(); // taskId -> Set(dependencyTaskIds it depends upon)
    this.reverseEdges = new Map(); // taskId -> Set(taskIds that depend on this task)
  }

  addTask(task) {
    if (!task.id) throw new Error("Task must have an 'id'");
    this.tasks.set(task.id, task);
    if (!this.edges.has(task.id)) this.edges.set(task.id, new Set());
    if (!this.reverseEdges.has(task.id)) this.reverseEdges.set(task.id, new Set());

    // Register initial dependencies
    if (Array.isArray(task.dependencies)) {
      for (const depId of task.dependencies) {
        this.addDependency(task.id, depId);
      }
    }
  }

  addDependency(taskId, dependsOnTaskId) {
    if (taskId === dependsOnTaskId) {
      throw new Error(`Circular dependency detected: Task '${taskId}' cannot depend on itself.`);
    }

    if (!this.edges.has(taskId)) this.edges.set(taskId, new Set());
    if (!this.reverseEdges.has(dependsOnTaskId)) this.reverseEdges.set(dependsOnTaskId, new Set());

    this.edges.get(taskId).add(dependsOnTaskId);
    this.reverseEdges.get(dependsOnTaskId).add(taskId);

    // Validate no cycle is introduced
    this.detectCycles();
  }

  detectCycles() {
    const visited = new Set();
    const inStack = new Set();
    const cyclePath = [];

    const dfs = (nodeId) => {
      visited.add(nodeId);
      inStack.add(nodeId);
      cyclePath.push(nodeId);

      const neighbors = this.edges.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (inStack.has(neighbor)) {
          cyclePath.push(neighbor);
          return true; // Cycle found
        }
      }

      inStack.delete(nodeId);
      cyclePath.pop();
      return false;
    };

    for (const taskId of this.tasks.keys()) {
      if (!visited.has(taskId)) {
        if (dfs(taskId)) {
          const cycleStr = cyclePath.join(' -> ');
          throw new Error(`Circular dependency detected in Task DAG: ${cycleStr}`);
        }
      }
    }
    return false;
  }

  /**
   * Get all tasks that have all dependencies completed and are ready to execute
   */
  getReadyTasks(completedTaskIds = new Set()) {
    const ready = [];
    for (const [taskId, task] of this.tasks.entries()) {
      if (completedTaskIds.has(taskId) || task.status === 'completed' || task.status === 'running') {
        continue;
      }

      const deps = this.edges.get(taskId) || new Set();
      let allDepsMet = true;
      for (const depId of deps) {
        if (!completedTaskIds.has(depId)) {
          allDepsMet = false;
          break;
        }
      }

      if (allDepsMet) {
        ready.push(task);
      }
    }
    return ready;
  }

  /**
   * Generates execution tiers / batches for parallel execution
   */
  getExecutionBatches() {
    this.detectCycles();
    const batches = [];
    const completed = new Set();
    const totalTasks = this.tasks.size;

    while (completed.size < totalTasks) {
      const currentBatch = this.getReadyTasks(completed);
      if (currentBatch.length === 0) {
        // Stalemate / unresolved external dependencies
        break;
      }
      batches.push(currentBatch.map(t => t.id));
      for (const t of currentBatch) {
        completed.add(t.id);
      }
    }

    return batches;
  }
}
