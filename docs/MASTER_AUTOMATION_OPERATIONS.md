# Master automation operations

GitHub Actions runs Python and Node tests, workforce tests, JSON syntax validation and Python dependency audits on PRs, main pushes, manual dispatch and twice daily (06:00 and 17:00 IST, approximate). Results appear in the Actions job summary. No paid AI API is called by this workflow intentionally; review existing test code before enabling secrets. GitHub runner and package registry availability are required.

## n8n activation

Import the existing master blueprint from `workflows/00_master/00_MASTER_CODERAKSH_ALL_26_AGENTS_CONNECTED.json` into your n8n instance. Configure credentials inside n8n, replace placeholders, set Asia/Kolkata timezone and test each department with synthetic data. Keep outbound messaging, financial actions, active security testing and publishing disabled until separately approved. Do not enable the entire canvas blindly. The master blueprint requires external credentials and may incur provider costs. Never commit credentials.

## Remaining integration

Live CRM, finance, content publishing, production deployment, secret scanning and dependency update PRs are not enabled by this workflow. Configure and validate these separately. JSON syntax checks do not prove n8n runtime compatibility. Review CI results before merging. Scheduled runs require the workflow on the default branch and Actions enabled.
