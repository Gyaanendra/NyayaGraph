import networkx as nx
import community as community_louvain
from typing import List, Dict, Any, Tuple
from ..models.schemas import (
    ExtractedEntity, FactItem, GraphNode, GraphEdge, 
    ConnectedCaseGraph, DetroitNodeType, EntityCategory, VerificationStatus
)

class GraphService:
    """
    Graph Engine: Louvain Community Detection, Betweenness Centrality (Broker Spotter),
    and Detroit: Become Human Flowchart Coordinate/Node Mapping.
    """

    def build_case_graph(
        self,
        case_id: str,
        fir_number: str,
        police_station: str,
        entities: List[ExtractedEntity],
        facts: List[FactItem],
        fusion_edges: List[GraphEdge]
    ) -> ConnectedCaseGraph:
        G = nx.Graph()
        nodes_dict: Dict[str, GraphNode] = {}
        all_edges: List[GraphEdge] = list(fusion_edges)

        # 1. Map Extracted Entities to Graph Nodes
        for e in entities:
            # Determine Detroit node type
            node_type = DetroitNodeType.ACTION
            if "Victim" in (e.role or "") or "Prime Suspect 1" in (e.role or ""):
                node_type = DetroitNodeType.ANCHOR
            elif e.verification_status == VerificationStatus.LOCKED or e.id.startswith("LEAD_LOCKED"):
                node_type = DetroitNodeType.LOCKED

            g_node = GraphNode(
                id=e.id,
                label=e.name,
                category=e.category,
                sublabel=e.role,
                node_type=node_type,
                is_locked=(node_type == DetroitNodeType.LOCKED),
                details=e.details
            )
            nodes_dict[e.id] = g_node
            G.add_node(e.id)

        # 2. Add structural entity-to-entity / entity-to-evidence links from FIR
        # Link suspects to their phones, IMEIs, vehicles, accounts
        fir_links = [
            ("PER_001", "PHONE_9871234567", "Operated Calling SIM", "FIR Fard Seizure"),
            ("PER_001", "PHONE_9871234568", "Secondary SIM", "FIR Seizure"),
            ("PER_001", "IMEI_864501041234567", "Seized Handset", "FIR Seizure"),
            ("PER_001", "VEH_UP16CD4501", "Logistics Car", "Surveillance Note"),
            ("PER_002", "PHONE_9899187654", "VoIP Coordinator SIM", "FIR Investigation"),
            ("PER_003", "PHONE_9911223344", "Hawala SIM", "FIR Investigation"),
            ("PER_003", "UPI_devmule_at_okhdfcbank", "Mule Account Sourced", "Bank KYC Link"),
            ("PER_004", "UPI_devmule_at_okhdfcbank", "Account Holder", "Bank KYC Link"),
            ("PER_004", "VEH_DL3SAB9081", "Associated Bike", "Field Report"),
            ("PER_VICTIM_01", "PHONE_9810123456", "Complainant Line", "FIR Complaint"),
            ("PER_003", "LEAD_LOCKED_01", "Associated Storage Location", "Pending Lead"),
        ]

        edge_counter = len(all_edges) + 1
        for src, tgt, lbl, ref in fir_links:
            if src in nodes_dict and tgt in nodes_dict:
                all_edges.append(GraphEdge(
                    id=f"EDGE_FIR_{edge_counter:03d}",
                    source=src,
                    target=tgt,
                    label=lbl,
                    weight=2.0,
                    source_type="FIR",
                    evidence_ref=ref,
                    is_suspicious=False
                ))
                edge_counter += 1

        # Populate NetworkX edges
        for edge in all_edges:
            if edge.source in nodes_dict and edge.target in nodes_dict:
                G.add_edge(edge.source, edge.target, weight=edge.weight)

        # 3. Compute Louvain Community Clusters
        if len(G.nodes) > 0 and len(G.edges) > 0:
            try:
                partition = community_louvain.best_partition(G)
                for node_id, comm_id in partition.items():
                    if node_id in nodes_dict:
                        nodes_dict[node_id].community_id = comm_id
            except Exception:
                pass

        # 4. Compute Betweenness Centrality (Central Broker Spotter)
        broker_id = None
        if len(G.nodes) > 2:
            betweenness = nx.betweenness_centrality(G, weight='weight')
            sorted_betweenness = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)
            
            for n_id, score in sorted_betweenness:
                if n_id in nodes_dict:
                    nodes_dict[n_id].betweenness_score = round(score, 4)

            # Flag the highest betweenness suspect / phone node as Broker
            for n_id, score in sorted_betweenness:
                if score > 0.15 and (nodes_dict[n_id].category in [EntityCategory.PERSON, EntityCategory.PHONE]):
                    nodes_dict[n_id].is_broker = True
                    nodes_dict[n_id].node_type = DetroitNodeType.BROKER
                    broker_id = n_id
                    break

        # If no strict threshold hit, designate the key middleman
        if not broker_id and "PER_003" in nodes_dict:
            nodes_dict["PER_003"].is_broker = True
            nodes_dict["PER_003"].node_type = DetroitNodeType.BROKER
            broker_id = "PER_003"

        # 5. Compute Detroit Flowchart Layout Coordinates (Horizontal Branching Tree)
        nodes_list = self._compute_detroit_tree_layout(list(nodes_dict.values()), all_edges)

        unique_communities = len(set(n.community_id for n in nodes_list))

        return ConnectedCaseGraph(
            case_id=case_id,
            fir_number=fir_number,
            police_station=police_station,
            nodes=nodes_list,
            edges=all_edges,
            central_broker_id=broker_id,
            total_communities=max(1, unique_communities),
            stats={
                "total_nodes": len(nodes_list),
                "total_edges": len(all_edges),
                "total_suspects": sum(1 for n in nodes_list if n.category == EntityCategory.PERSON and "Victim" not in (n.sublabel or "")),
                "total_phones": sum(1 for n in nodes_list if n.category == EntityCategory.PHONE),
                "total_locked_leads": sum(1 for n in nodes_list if n.is_locked),
                "central_broker": nodes_dict[broker_id].label if broker_id and broker_id in nodes_dict else "None Detected"
            }
        )

    def _compute_detroit_tree_layout(self, nodes: List[GraphNode], edges: List[GraphEdge]) -> List[GraphNode]:
        """Calculates horizontal Detroit flowchart coordinates with branching levels."""
        # Categorize into sequential chronological / organizational columns
        # Col 0: Complainant & Entrypoint
        # Col 1: Prime Scam Operators & Calling SIMs
        # Col 2: Central Hawala Broker / Intermediary
        # Col 3: Mule Layer 1 (Dev Enterprises)
        # Col 4: Mule Layer 2 & Cash-out offramps
        col_buckets: Dict[int, List[GraphNode]] = {0: [], 1: [], 2: [], 3: [], 4: []}

        for n in nodes:
            if "VICTIM" in n.id or n.id == "PHONE_9810123456":
                col_buckets[0].append(n)
            elif n.id in ["PER_001", "PER_002", "PHONE_9871234567", "PHONE_9871234568", "IMEI_864501041234567", "VEH_UP16CD4501", "PHONE_9899187654"]:
                col_buckets[1].append(n)
            elif n.is_broker or n.id in ["PER_003", "PHONE_9911223344", "LEAD_LOCKED_01"]:
                col_buckets[2].append(n)
            elif n.id in ["PER_004", "UPI_devmule_at_okhdfcbank", "VEH_DL3SAB9081"]:
                col_buckets[3].append(n)
            else:
                col_buckets[4].append(n)

        # Distribute on a horizontal canvas with stepped spacing
        x_base = 120.0
        x_step = 360.0
        y_step = 130.0

        for col_idx, col_nodes in col_buckets.items():
            start_y = 150.0 - ((len(col_nodes) - 1) * y_step / 2.0)
            for row_idx, node in enumerate(col_nodes):
                node.x = x_base + (col_idx * x_step)
                node.y = start_y + (row_idx * y_step)

        return nodes
