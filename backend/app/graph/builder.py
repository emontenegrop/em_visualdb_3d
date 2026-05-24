import math
import random
import networkx as nx
from app.schemas.db import TableSchema, GraphSchema, NodeSchema, EdgeSchema
import structlog

log = structlog.get_logger()


def build_graph(tables: list[TableSchema]) -> nx.DiGraph:
    G = nx.DiGraph()

    for table in tables:
        node_id = f"{table.schema_name}.{table.name}"
        G.add_node(
            node_id,
            schema=table.schema_name,
            table=table.name,
            row_count=table.row_count or 0,
            size_bytes=table.size_bytes or 0,
            column_count=len(table.columns),
        )

    for table in tables:
        src = f"{table.schema_name}.{table.name}"
        for fk in table.foreign_keys:
            tgt = f"{fk.ref_schema}.{fk.ref_table}"
            if G.has_node(tgt):
                G.add_edge(
                    src,
                    tgt,
                    constraint=fk.constraint_name,
                    source_column=fk.column,
                    target_column=fk.ref_column,
                )

    log.info("graph_built", nodes=G.number_of_nodes(), edges=G.number_of_edges())
    return G


def _sphere_layout(G: nx.DiGraph, radius: float = 50.0) -> dict[str, tuple]:
    nodes = list(G.nodes())
    n = len(nodes)
    positions = {}
    for i, node in enumerate(nodes):
        phi = math.acos(1 - 2 * (i + 0.5) / n)
        theta = math.pi * (1 + 5**0.5) * i
        positions[node] = (
            radius * math.sin(phi) * math.cos(theta),
            radius * math.sin(phi) * math.sin(theta),
            radius * math.cos(phi),
        )
    return positions


def graph_to_schema(G: nx.DiGraph, layout: str = "force") -> GraphSchema:
    if layout == "sphere":
        positions = _sphere_layout(G)
    else:
        # Use spring layout projected into 3D
        pos2d = nx.spring_layout(G, k=3, seed=42)
        positions = {n: (xy[0] * 80, xy[1] * 80, random.uniform(-20, 20)) for n, xy in pos2d.items()}

    centrality = nx.degree_centrality(G)
    undirected = G.to_undirected()

    nodes = []
    for node_id, data in G.nodes(data=True):
        x, y, z = positions.get(node_id, (0.0, 0.0, 0.0))
        nodes.append(
            NodeSchema(
                id=node_id,
                label=data.get("table", node_id),
                schema_name=data.get("schema", "public"),
                table_name=data.get("table", node_id),
                row_count=data.get("row_count", 0),
                size_bytes=data.get("size_bytes", 0),
                column_count=data.get("column_count", 0),
                degree=undirected.degree(node_id),
                centrality=round(centrality.get(node_id, 0.0), 4),
                x=round(x, 3),
                y=round(y, 3),
                z=round(z, 3),
            )
        )

    edges = []
    for i, (src, tgt, data) in enumerate(G.edges(data=True)):
        edges.append(
            EdgeSchema(
                id=f"e{i}",
                source=src,
                target=tgt,
                constraint_name=data.get("constraint", ""),
                source_column=data.get("source_column", ""),
                target_column=data.get("target_column", ""),
                weight=1.0,
            )
        )

    schemas = {G.nodes[n].get("schema", "public") for n in G.nodes()}

    return GraphSchema(
        nodes=nodes,
        edges=edges,
        node_count=len(nodes),
        edge_count=len(edges),
        schema_count=len(schemas),
    )


def compute_metrics(G: nx.DiGraph) -> dict:
    undirected = G.to_undirected()
    degrees = [d for _, d in undirected.degree()]
    centrality = nx.degree_centrality(G)

    top = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "total_tables": G.number_of_nodes(),
        "total_relationships": G.number_of_edges(),
        "total_schemas": len({G.nodes[n].get("schema", "public") for n in G.nodes()}),
        "avg_degree": round(sum(degrees) / max(len(degrees), 1), 2),
        "max_degree": max(degrees, default=0),
        "isolated_tables": len(list(nx.isolates(undirected))),
        "density": round(nx.density(G), 4),
        "most_connected": [{"id": k, "centrality": round(v, 4)} for k, v in top],
    }
