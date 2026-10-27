# 🛑 Human Approval Protocol

Whenever an agent encounters an action requiring approval:
1. The agent transitions the task status to `waiting_approval`.
2. The agent outputs a clear approval request specifying:
   - Action Name & Purpose
   - Impact / Potential Risk
   - Target Destination (e.g. email recipient, external API, table to drop)
   - Estimated Cost
3. The execution remains blocked until the Founder/Operator issues `workforce task approve <id>`.
