# 🛡️ PENETRATION TESTING & SECURITY AUDIT RULES OF ENGAGEMENT (RoE)
### Mutual Authorization and Safe Harbor Agreement

**Service Provider:** CodeRaksh Company  
**Client / Target Owner:** [CLIENT COMPANY NAME]  
**Effective Date:** [DATE]  

---

### 1. Authorization & Legal Safe Harbor
The Client hereby grants explicit, authorized permission to **CodeRaksh Company** and its certified offensive security personnel to conduct authorized vulnerability assessment and penetration testing (VAPT) against the agreed in-scope target systems defined in Section 2.
Testing conducted within the boundaries of this Agreement shall be considered **authorized access** under the Information Technology Act (India), Computer Fraud and Abuse Act (CFAA), and applicable local cyber security regulations.

### 2. In-Scope Target Systems
- **Web Applications / APIs:** `https://api.client.com`, `https://app.client.com`
- **Cloud Infrastructure:** AWS Account ID `[AWS_ACCOUNT_ID]` / Designated VPCs
- **IP Ranges / CIDR:** `[IN_SCOPE_IP_RANGES]`
- **Excluded Targets (Out of Scope):** Third-party SaaS payment gateways, physical office premises, DDoS attacks.

### 3. Testing Methodology & Boundaries
- Testing shall follow the **OWASP Web Security Testing Guide (WSTG)** and **NIST SP 800-115**.
- **Denial of Service (DoS/DDoS):** Strictly prohibited unless explicitly requested.
- **Data Exfiltration:** If sensitive PII or credentials are recovered as proof-of-concept, testing shall halt immediately and the finding escalated to the Client point-of-contact within **2 hours**.

### 4. Emergency Escalation Point-of-Contact
- **Client Lead:** [NAME], Email: [EMAIL], Phone: [PHONE]
- **CodeRaksh Lead:** Chetan Biranje, Email: security@coderaksh.com, Phone: +91 [PHONE]

---
**Signed by Authorized Representatives:**

**For Client:** _________________________ Date: ______________  
**For CodeRaksh:** ______________________ Date: ______________  
