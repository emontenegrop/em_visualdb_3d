import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useGraphStore } from "@/store/graphStore";
import { GraphNode, GraphEdge } from "@/services/api";

const SCHEMA_COLORS: Record<string, string> = {
  public: "#00d4ff",
  auth: "#7c3aed",
  api: "#ff2d78",
  app: "#10b981",
  data: "#f59e0b",
};

function getSchemaColor(schema: string): string {
  return SCHEMA_COLORS[schema] ?? "#6b7280";
}

function nodeSize(node: GraphNode): number {
  const base = 0.4;
  const scale = Math.log10(Math.max(node.row_count, 1) + 1) * 0.15;
  const degree = node.degree * 0.05;
  return Math.min(base + scale + degree, 1.5);
}

interface NodeMeshProps {
  node: GraphNode;
}

function NodeMesh({ node }: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { selectedNode, hoveredNode, selectNode, setHoveredNode } =
    useGraphStore();

  const isSelected = selectedNode?.id === node.id;
  const isHovered = hoveredNode === node.id;
  const color = getSchemaColor(node.schema_name);
  const size = nodeSize(node);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isSelected || isHovered) {
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
        onClick={() => selectNode(isSelected ? null : node)}
        onPointerOver={() => setHoveredNode(node.id)}
        onPointerOut={() => setHoveredNode(null)}
      >
        <icosahedronGeometry args={[size, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : 0.2}
          metalness={0.6}
          roughness={0.2}
          wireframe={isSelected}
        />
      </mesh>

      {/* Glow ring */}
      {(isSelected || isHovered) && (
        <mesh>
          <torusGeometry args={[size * 1.4, 0.03, 8, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}

      <Text
        position={[0, size + 0.3, 0]}
        fontSize={0.25}
        color={isSelected ? "#ffffff" : color}
        anchorX="center"
        anchorY="bottom"
        renderOrder={1}
      >
        {node.label}
      </Text>
    </group>
  );
}

interface EdgeLineProps {
  edge: GraphEdge;
  nodeMap: Map<string, GraphNode>;
}

function EdgeLine({ edge, nodeMap }: EdgeLineProps) {
  const src = nodeMap.get(edge.source);
  const tgt = nodeMap.get(edge.target);
  if (!src || !tgt) return null;

  const points = useMemo(() => {
    const s = new THREE.Vector3(src.x, src.y, src.z);
    const t = new THREE.Vector3(tgt.x, tgt.y, tgt.z);
    const mid = s.clone().lerp(t, 0.5);
    mid.y += 5;
    // Bezier curve
    const curve = new THREE.QuadraticBezierCurve3(s, mid, t);
    return curve.getPoints(20);
  }, [src.x, src.y, src.z, tgt.x, tgt.y, tgt.z]);

  return (
    <Line
      points={points}
      color="#1a4a6a"
      lineWidth={0.5}
      transparent
      opacity={0.5}
    />
  );
}

function Scene() {
  const { graphData, searchQuery } = useGraphStore();
  const { camera } = useThree();

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    graphData?.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [graphData]);

  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    if (!searchQuery) return graphData.nodes;
    const q = searchQuery.toLowerCase();
    return graphData.nodes.filter(
      (n) =>
        n.table_name.toLowerCase().includes(q) ||
        n.schema_name.toLowerCase().includes(q)
    );
  }, [graphData, searchQuery]);

  const filteredIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  );

  const visibleEdges = useMemo(
    () =>
      graphData?.edges.filter(
        (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
      ) ?? [],
    [graphData, filteredIds]
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 50, 0]} intensity={1} color="#00d4ff" />
      <pointLight position={[-50, -20, -30]} intensity={0.5} color="#7c3aed" />
      <Stars
        radius={200}
        depth={60}
        count={3000}
        factor={3}
        saturation={0}
        fade
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={300}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      {visibleEdges.map((edge) => (
        <EdgeLine key={edge.id} edge={edge} nodeMap={nodeMap} />
      ))}

      {filteredNodes.map((node) => (
        <NodeMesh key={node.id} node={node} />
      ))}
    </>
  );
}

export default function GraphScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 120], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#050a14" }}
    >
      <Scene />
    </Canvas>
  );
}
