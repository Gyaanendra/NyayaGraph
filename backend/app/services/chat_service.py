import os
import json
import time
import requests
from typing import Dict, Any, List, Optional
from ..core.database import get_connection
from .vector_service import VectorService


class ChatService:
    """
    RAG-Powered AI Legal Detective Copilot.
    Queries NyayaGraph Knowledge Base (ChromaDB + SQLite) and uses Bitdeer's
    zai-org/GLM-5.3-Flash API for criminal syndicate analysis, legal audit,
    and evidence interrogation.
    """

    BITDEER_URL = "https://api-inference.bitdeer.ai/v1/chat/completions"
    DEFAULT_MODEL = "zai-org/GLM-5.3-Flash"
    DEFAULT_API_KEY = "cXNyy73KwaUGwALhZthf"

    def __init__(self):
        self.api_key = os.environ.get("BITDEER_API_KEY", self.DEFAULT_API_KEY)
        self.model = os.environ.get("BITDEER_MODEL", self.DEFAULT_MODEL)
        self.vector_service = VectorService()

    def retrieve_context(self, query: str, case_id: Optional[str] = None, top_k: int = 4) -> Dict[str, Any]:
        """
        Retrieves relevant forensic evidence from ChromaDB vector store
        and SQLite structured tables.
        """
        conn = get_connection()
        c = conn.cursor()

        # 1. Semantic Vector Search via ChromaDB
        semantic_cases = self.vector_service.search_similar_cases(query, top_k=top_k)

        # 2. Suspect Dossier Search via ChromaDB
        suspect_hits = []
        try:
            suspect_col = self.vector_service.client.get_collection("suspect_dossiers")
            if suspect_col.count() > 0:
                s_res = suspect_col.query(query_texts=[query], n_results=min(suspect_col.count(), 4))
                if s_res and s_res.get("documents"):
                    for d in s_res["documents"][0]:
                        suspect_hits.append(d)
        except Exception:
            pass

        # 3. Specific Case Lookup (if case_id provided or mentioned in query)
        focused_case = None
        target_cid = case_id
        if not target_cid:
            import re
            m = re.search(r'RC[0-9]{3}[0-9]{4}[A-Z][0-9]{4}', query, re.IGNORECASE)
            if m:
                target_cid = f"CASE_CBI_{m.group(0).upper()}"

        if target_cid:
            c.execute("SELECT * FROM cases WHERE case_id = ? OR fir_number = ?", (target_cid, target_cid))
            row = c.fetchone()
            if row:
                focused_case = dict(row)
                c.execute("SELECT name, category, role FROM entities WHERE case_id = ?", (row["case_id"],))
                focused_case["entities"] = [dict(r) for r in c.fetchall()]
                c.execute("SELECT category, description, timestamp, location FROM facts WHERE case_id = ?", (row["case_id"],))
                focused_case["facts"] = [dict(r) for r in c.fetchall()]

        # 4. Keyword entity search from SQLite
        keyword_entities = []
        words = [w.strip() for w in query.split() if len(w.strip()) > 3]
        if words:
            like_clause = " OR ".join(["name LIKE ?"] * min(len(words), 3))
            params = [f"%{w}%" for w in words[:3]]
            try:
                c.execute(f"SELECT id, case_id, name, category, role FROM entities WHERE {like_clause} LIMIT 6", params)
                keyword_entities = [dict(r) for r in c.fetchall()]
            except Exception:
                pass

        conn.close()

        return {
            "semantic_cases": semantic_cases,
            "suspect_hits": suspect_hits,
            "focused_case": focused_case,
            "keyword_entities": keyword_entities
        }

    def build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Constructs rich investigative context for the GLM model."""
        ctx_parts = []

        if context.get("focused_case"):
            fc = context["focused_case"]
            ctx_parts.append("=== FOCUSED CASE DOSSIER ===")
            ctx_parts.append(f"FIR Number: {fc.get('fir_number')} | Branch: {fc.get('police_station')} | Date: {fc.get('date_time')}")
            ctx_parts.append(f"BSA 63(4) Evidence SHA-256: {fc.get('sha256_hash')}")
            ctx_parts.append(f"Blockchain TX: {fc.get('blockchain_tx_hash')}")
            if fc.get("entities"):
                ents_str = ", ".join([f"{e['name']} ({e['role']})" for e in fc["entities"][:8]])
                ctx_parts.append(f"Key Entities / Accused: {ents_str}")
            if fc.get("facts"):
                facts_str = "\n".join([f"- [{f.get('category')}] {f.get('description')}" for f in fc["facts"][:6]])
                ctx_parts.append(f"Chronological Crime Facts:\n{facts_str}")
            if fc.get("raw_text"):
                ctx_parts.append(f"Case Excerpt:\n{fc['raw_text'][:2000]}")

        if context.get("semantic_cases"):
            ctx_parts.append("\n=== SEMANTIC CASE MATCHES FROM KNOWLEDGE BASE ===")
            for idx, sc in enumerate(context["semantic_cases"], 1):
                meta = sc.get("metadata", {})
                snippet = sc.get("document_snippet", "")
                ctx_parts.append(
                    f"[{idx}] FIR: {meta.get('fir_number', sc.get('case_id'))} | PS: {meta.get('police_station', 'CBI')}\n"
                    f"    Similarity: {sc.get('similarity_score', 0)}%\n"
                    f"    Snippet: {snippet}"
                )

        if context.get("suspect_hits"):
            ctx_parts.append("\n=== ACCUSED / SUSPECT DOSSIERS ===")
            for sh in context["suspect_hits"][:4]:
                ctx_parts.append(f"- {sh}")

        if context.get("keyword_entities"):
            ctx_parts.append("\n=== MATCHING NAMED ENTITIES IN REGISTRY ===")
            for ke in context["keyword_entities"]:
                ctx_parts.append(f"- {ke.get('name')} | Role: {ke.get('role')} | Case: {ke.get('case_id')}")

        context_str = "\n".join(ctx_parts) if ctx_parts else "No specific case matches found in registry for this query."

        return (
            "You are NyayaGraph AI Detective, an elite Senior Criminal Intelligence Analyst and Legal Forensic Copilot "
            "specializing in Central Bureau of Investigation (CBI) cases, banking fraud syndicates, corruption, and "
            "evidence chain-of-custody under Bharatiya Sakshya Adhiniyam (BSA) 2023 Section 63(4).\n\n"
            "INSTRUCTIONS:\n"
            "1. Answer questions thoroughly, accurately, and professionally based on the verified CBI records provided below.\n"
            "2. Cite specific FIR numbers, legal sections (e.g. IPC 420, 120-B, PC Act Sec 7/13), accused names, and defrauded banks.\n"
            "3. If cross-case syndicate links exist, highlight shared shell entities, common accused, or modus operandi.\n"
            "4. Maintain a sharp, authoritative, yet objective investigative tone.\n"
            "5. If information is not in the context, state so clearly and offer logical forensic deduction based on Indian criminal procedure.\n\n"
            f"VERIFIED FORENSIC CONTEXT FROM NYAYAGRAPH KNOWLEDGE BASE:\n{context_str}"
        )

    def answer_query(
        self,
        query: str,
        case_id: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        timeout: int = 12
    ) -> Dict[str, Any]:
        """
        Executes RAG retrieval and queries Bitdeer GLM-5.3-Flash.
        Falls back to local synthesized answer if external API times out.
        """
        t0 = time.time()
        context = self.retrieve_context(query, case_id=case_id)
        system_prompt = self.build_system_prompt(context)

        messages = [{"role": "system", "content": system_prompt}]

        if chat_history:
            for h in chat_history[-4:]:
                messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

        messages.append({"role": "user", "content": query})

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1024,
            "top_p": 0.95,
            "temperature": 0.7,
            "stream": False
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "NyayaGraph-Detective/1.0"
        }

        ai_response_text = ""
        engine_used = f"Bitdeer ({self.model})"
        try:
            resp = requests.post(self.BITDEER_URL, json=payload, headers=headers, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                ai_response_text = data["choices"][0]["message"]["content"]
            else:
                ai_response_text = self._generate_fallback_response(query, context, error_msg=f"Bitdeer status {resp.status_code}")
                engine_used = "NyayaGraph Forensic Engine (Knowledge Base Synthesis)"
        except Exception as e:
            ai_response_text = self._generate_fallback_response(query, context, error_msg=str(e))
            engine_used = "NyayaGraph Forensic Engine (Knowledge Base Synthesis)"

        latency = round(time.time() - t0, 2)

        citations = []
        for sc in context.get("semantic_cases", []):
            meta = sc.get("metadata", {})
            citations.append({
                "case_id": sc.get("case_id"),
                "fir_number": meta.get("fir_number"),
                "police_station": meta.get("police_station"),
                "similarity_score": sc.get("similarity_score")
            })

        return {
            "answer": ai_response_text,
            "engine": engine_used,
            "latency_seconds": latency,
            "citations": citations,
            "focused_case_id": context.get("focused_case", {}).get("case_id") if context.get("focused_case") else None,
            "entities_found": len(context.get("keyword_entities", [])) + len(context.get("suspect_hits", []))
        }

    def _generate_fallback_response(self, query: str, context: Dict[str, Any], error_msg: str = "") -> str:
        """
        Robust forensic response generator based on retrieved SQLite and ChromaDB data
        when external API queues or times out.
        """
        lines = []
        lines.append("### 🔍 Verified Forensic Intelligence Analysis\n")

        fc = context.get("focused_case")
        if fc:
            lines.append(f"**Target Case**: FIR **{fc.get('fir_number')}**")
            lines.append(f"- **Police Station / Branch**: {fc.get('police_station')}")
            lines.append(f"- **Registration Date**: {fc.get('date_time')}")
            lines.append(f"- **BSA 2023 Sec 63(4) Hash**: `{fc.get('sha256_hash')}`")
            lines.append(f"- **Blockchain Block**: `{fc.get('blockchain_tx_hash')}`\n")

            if fc.get("entities"):
                lines.append("**Primary Accused & Corporate Shells:**")
                for e in fc["entities"][:6]:
                    lines.append(f"- **{e['name']}** — *{e.get('role', 'Accused')}* ({e.get('category')})")
                lines.append("")

            if fc.get("facts"):
                lines.append("**Key Crime Facts & Allegations:**")
                for f in fc["facts"][:5]:
                    lines.append(f"- [{f.get('category')}] {f.get('description')}")
                lines.append("")

        sem = context.get("semantic_cases", [])
        if sem:
            lines.append("**Related Cases in Crime Syndicate Registry:**")
            for sc in sem[:3]:
                meta = sc.get("metadata", {})
                lines.append(
                    f"- **FIR {meta.get('fir_number', sc.get('case_id'))}** ({meta.get('police_station')}) "
                    f"— *{sc.get('similarity_score')}% semantic match*"
                )
                if sc.get("document_snippet"):
                    lines.append(f"  > \"{sc['document_snippet'][:180]}...\"")
            lines.append("")

        if context.get("suspect_hits"):
            lines.append("**Suspect Dossiers Found:**")
            for sh in context["suspect_hits"][:3]:
                lines.append(f"- {sh}")
            lines.append("")

        if not fc and not sem:
            lines.append(
                f"No direct record in the active CBI knowledge base was found matching: *\"{query}\"*.\n\n"
                "**Tips for query:**\n"
                "- Search by FIR Number (e.g. `RC0782026E0004`, `RC0172024E0023`)\n"
                "- Search by suspect name (e.g. `Anowar Hussain`)\n"
                "- Search by bank (e.g. `State Bank of India`, `Canara Bank`)\n"
                "- Search by crime type (e.g. `loan diversion`, `credit facility default`)"
            )

        return "\n".join(lines)
