import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from ..models.schemas import CaseProcessingResult
from ..services.extractor_service import ExtractorService
from ..services.fusion_service import FusionService
from ..services.graph_service import GraphService
from ..services.pattern_service import PatternService
from ..services.cross_case_service import CrossCaseService
from ..services.blockchain_service import BlockchainService

router = APIRouter(prefix="/api/v1/cases", tags=["cases"])

extractor_service = ExtractorService()
fusion_service = FusionService()
graph_service = GraphService()
pattern_service = PatternService()
cross_case_service = CrossCaseService()
blockchain_service = BlockchainService()

def load_default_samples():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    fir_path = os.path.join(base_dir, "data", "sample_firs", "fir_01_noida_cyber.txt")
    cdr_path = os.path.join(base_dir, "data", "sample_cdrs", "cdr_case_01.csv")
    bank_path = os.path.join(base_dir, "data", "sample_bank", "bank_case_01.csv")

    fir_text = ""
    cdr_csv = ""
    bank_csv = ""

    if os.path.exists(fir_path):
        with open(fir_path, 'r', encoding='utf-8') as f:
            fir_text = f.read()
    if os.path.exists(cdr_path):
        with open(cdr_path, 'r', encoding='utf-8') as f:
            cdr_csv = f.read()
    if os.path.exists(bank_path):
        with open(bank_path, 'r', encoding='utf-8') as f:
            bank_csv = f.read()

    return fir_text, cdr_csv, bank_csv

@router.get("/sample", response_model=CaseProcessingResult)
def get_sample_case_analysis():
    """
    Instant end-to-end processing of the sample Noida Cyber Extortion case.
    Executes Ingestion -> Entity Extraction & Verification -> Multi-Source Fusion ->
    Detroit Flowchart Graph Construction -> Pattern Spotting -> Cross-Case Resemblance.
    """
    fir_text, cdr_csv, bank_csv = load_default_samples()
    if not fir_text:
        raise HTTPException(status_code=404, detail="Sample dataset files not found")

    # 1. SHA-256 Hash & Blockchain Anchor
    file_hash = blockchain_service.compute_sha256(fir_text + cdr_csv + bank_csv)
    anchor_info = blockchain_service.anchor_evidence(
        fir_number="112/2026",
        police_station="Cyber Crime PS, Gautam Buddha Nagar",
        io_name="Sub-Inspector Rajesh",
        file_sha256=file_hash
    )

    # 2. Extract Entities & Facts with Closed-World Verifier
    entities, facts = extractor_service.extract_from_fir_text(fir_text)

    # 3. Fuse Structured CDR and Bank Data
    cdr_records = fusion_service.parse_cdr_data(cdr_csv)
    bank_records = fusion_service.parse_bank_data(bank_csv)
    fusion_edges = fusion_service.generate_fusion_edges(cdr_records, bank_records)

    # 4. Build Connected Graph (NetworkX, Louvain, Betweenness, Detroit Layout)
    graph = graph_service.build_case_graph(
        case_id="CASE_2026_NOIDA_112",
        fir_number="112/2026",
        police_station="Cyber Crime PS, Gautam Buddha Nagar",
        entities=entities,
        facts=facts,
        fusion_edges=fusion_edges
    )

    # 5. Detect Detective Tradecraft Patterns
    broker_node = next((n for n in graph.nodes if n.is_broker), None)
    patterns = pattern_service.analyze_patterns(
        nodes=graph.nodes,
        edges=graph.edges,
        cdr_records=cdr_records,
        bank_records=bank_records,
        broker_node=broker_node
    )

    # 6. Find Cross-Case Resemblance & Guidance
    resemblance = cross_case_service.find_resemblance(entities, active_case_mo="customs digital arrest")

    return CaseProcessingResult(
        case_id="CASE_2026_NOIDA_112",
        fir_number="112/2026",
        police_station="Cyber Crime PS, Gautam Buddha Nagar",
        date_time="14/02/2026 11:30 hrs",
        sha256_hash=file_hash,
        blockchain_tx_hash=anchor_info["blockchain_tx_hash"],
        entities=entities,
        facts=facts,
        graph=graph,
        patterns=patterns,
        cross_case_match=resemblance
    )

@router.post("/process", response_model=CaseProcessingResult)
async def process_custom_case(
    fir_text: str = Form(...),
    cdr_csv: Optional[str] = Form(""),
    bank_csv: Optional[str] = Form(""),
    fir_number: str = Form("112/2026"),
    police_station: str = Form("Cyber Crime PS, Gautam Buddha Nagar"),
    io_name: str = Form("Sub-Inspector Rajesh")
):
    """
    Process custom uploaded case documents and build full connected case graph.
    """
    file_hash = blockchain_service.compute_sha256(fir_text + (cdr_csv or "") + (bank_csv or ""))
    anchor_info = blockchain_service.anchor_evidence(
        fir_number=fir_number,
        police_station=police_station,
        io_name=io_name,
        file_sha256=file_hash
    )

    entities, facts = extractor_service.extract_from_fir_text(fir_text)
    
    cdr_records = fusion_service.parse_cdr_data(cdr_csv) if cdr_csv else []
    bank_records = fusion_service.parse_bank_data(bank_csv) if bank_csv else []
    fusion_edges = fusion_service.generate_fusion_edges(cdr_records, bank_records)

    graph = graph_service.build_case_graph(
        case_id=f"CASE_{fir_number.replace('/', '_')}",
        fir_number=fir_number,
        police_station=police_station,
        entities=entities,
        facts=facts,
        fusion_edges=fusion_edges
    )

    broker_node = next((n for n in graph.nodes if n.is_broker), None)
    patterns = pattern_service.analyze_patterns(
        nodes=graph.nodes,
        edges=graph.edges,
        cdr_records=cdr_records,
        bank_records=bank_records,
        broker_node=broker_node
    )

    resemblance = cross_case_service.find_resemblance(entities)

    return CaseProcessingResult(
        case_id=f"CASE_{fir_number.replace('/', '_')}",
        fir_number=fir_number,
        police_station=police_station,
        date_time="Active Ingestion",
        sha256_hash=file_hash,
        blockchain_tx_hash=anchor_info["blockchain_tx_hash"],
        entities=entities,
        facts=facts,
        graph=graph,
        patterns=patterns,
        cross_case_match=resemblance
    )
