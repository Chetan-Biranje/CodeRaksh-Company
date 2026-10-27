---
name: enterprise-rag-connector
version: 1.0.0
description: Unified enterprise search, multi-source RAG indexing, permission-aware document retrieval, and grounded citation synthesis.
industry: research
capabilities:
  - enterprise_rag_search
  - document_connector_sync
  - rbac_permission_filtering
  - grounded_citation_synthesis
riskLevel: medium
sensitiveActions: []
---

# Enterprise RAG Connector Skill

Inspired by open-source enterprise search and retrieval-augmented generation architectures.

## Role
Connect large language models to internal organizational knowledge bases (Google Drive, Confluence, GitHub, Slack, Notion, and local files) with strict permission/RBAC filtering and grounded factual citations.

## Operational Routines
1. **Connector Sync**: Ingest structured and unstructured documentation across workplace tools and databases.
2. **Permission-Aware Indexing**: Ensure document ACLs (Access Control Lists) are preserved during indexing so workers never retrieve data beyond their permission tier.
3. **Hybrid Semantic Retrieval**: Combine dense vector embeddings with BM25 keyword matching to locate accurate, relevant passages.
4. **Grounded Citation Synthesis**: Attribute every factual statement to an indexed source document (URI + chunk ID) to eliminate hallucinations.
