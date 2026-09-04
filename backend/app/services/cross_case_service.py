import json
import os
from typing import List, Optional, Dict, Any
from ..models.schemas import CrossCaseResemblance, ExtractedEntity

class CrossCaseService:
    """
    Cross-Case Resemblance Engine & Investigative Guidance Generator.
    Surfaces historical case matches and connects the current IO with past Investigating Officers.
    """

    def __init__(self, archive_path: str = None):
        if not archive_path:
            # Default to data/historical_cases/archive_cases.json
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            archive_path = os.path.join(base_dir, "data", "historical_cases", "archive_cases.json")
        self.archive_path = archive_path
        self._load_archive()

    def _load_archive(self):
        self.archive = []
        if os.path.exists(self.archive_path):
            try:
                with open(self.archive_path, 'r', encoding='utf-8') as f:
                    self.archive = json.load(f)
            except Exception:
                self.archive = []

    def find_resemblance(self, entities: List[ExtractedEntity], active_case_mo: str = "") -> Optional[CrossCaseResemblance]:
        if not self.archive:
            return None

        # Extract active case tokens
        active_phones = {re.sub(r'\D', '', e.name) for e in entities if e.category.value == "PHONE"}
        active_vehicles = {e.name.upper().replace(' ', '') for e in entities if e.category.value == "VEHICLE"}
        active_names = {e.name.lower() for e in entities if e.category.value == "PERSON"}
        active_upis = {e.name.lower() for e in entities if e.category.value == "UPI_ID"}

        best_match = None
        highest_score = 0.0

        for past_case in self.archive:
            score = 0.0
            overlap_dict = {"phones": [], "vehicles": [], "suspect_names": [], "upi_ids": []}

            # Check phone collisions
            past_phones = past_case.get("key_identifiers", {}).get("phones", [])
            for p in past_phones:
                clean_p = re.sub(r'\D', '', p)
                if clean_p in active_phones:
                    score += 35.0
                    overlap_dict["phones"].append(p)

            # Check vehicle collisions
            past_vehs = past_case.get("key_identifiers", {}).get("vehicles", [])
            for v in past_vehs:
                clean_v = v.upper().replace(' ', '')
                if clean_v in active_vehicles:
                    score += 25.0
                    overlap_dict["vehicles"].append(v)

            # Check name / alias collisions
            past_names = past_case.get("key_identifiers", {}).get("suspect_names", [])
            for n in past_names:
                for a_name in active_names:
                    if any(part in a_name for part in n.lower().split() if len(part) > 3):
                        score += 20.0
                        overlap_dict["suspect_names"].append(n)
                        break

            # Check UPI collisions
            past_upis = past_case.get("key_identifiers", {}).get("upi_ids", [])
            for u in past_upis:
                if u.lower() in active_upis:
                    score += 15.0
                    overlap_dict["upi_ids"].append(u)

            # Baseline MO similarity bonus
            if "customs" in past_case.get("modus_operandi", "").lower() or "digital arrest" in past_case.get("modus_operandi", "").lower():
                score += 10.0

            if score > highest_score:
                highest_score = score
                best_match = (past_case, min(95.0, score), overlap_dict)

        if best_match and highest_score >= 30.0:
            past_case, pct, overlap_dict = best_match
            io_name = past_case.get("investigating_officer", "Inspector Sharma")
            fir_no = past_case.get("fir_number", "45/2024")
            ps = past_case.get("police_station", "Cyber Cell Surajpur")

            return CrossCaseResemblance(
                matched_case_id=past_case.get("case_id", "PAST_CASE_01"),
                matched_fir_number=fir_no,
                police_station=ps,
                investigating_officer=io_name,
                io_contact=past_case.get("io_contact", "+91-98765-43210"),
                resemblance_percentage=round(pct, 1),
                overlapping_identifiers=overlap_dict,
                syndicate_structure=past_case.get("syndicate_structure", ""),
                recovery_tactics_and_leads=past_case.get("recovery_tactics_and_leads", ""),
                recommended_action=(
                    f"This pattern has an {pct:.0f}% resemblance to FIR {fir_no} ({ps}) "
                    f"handled by {io_name}. Recommend contacting {io_name} for guidance "
                    f"on their syndicate structure, interrogation leads, and recovery tactics."
                )
            )

        return None

import re
