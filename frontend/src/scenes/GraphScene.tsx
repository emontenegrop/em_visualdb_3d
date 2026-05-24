import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Stars, Html } from "@react-three/drei";
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
  const base = 0.9;
  const scale = Math.log10(Math.max(node.row_count, 1) + 1) * 0.35;
  const degree = node.degree * 0.12;
  return Math.min(base + scale + degree, 3.5);
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
          emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.5 : 0.2}
          metalness={0.6}
          roughness={0.2}
          wireframe={isSelected}
        />
      </mesh>

      {/* Glow ring */}
      {(isSelected || isHovered) && (
        <mesh>
          <torusGeometry args={[size * 1.5, 0.06, 8, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Label siempre legible — tamaño fijo en píxeles de pantalla */}
      <Html
        position={[0, size + 1.0, 0]}
        center
        zIndexRange={[50, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isSelected ? 14 : isHovered ? 13 : 11,
            fontWeight: isSelected || isHovered ? 700 : 500,
            color: isSelected ? "#ffffff" : isHovered ? "#ffffff" : color,
            whiteSpace: "nowrap",
            textShadow: `0 0 6px #050a14, 0 0 12px #050a14, 0 0 20px #050a14`,
            letterSpacing: "0.03em",
            transition: "font-size 0.15s, color 0.15s",
          }}
        >
          {node.table_name}
        </div>
      </Html>

      {/* Tooltip expandido solo en hover */}
      {isHovered && (
        <Html
          position={[0, size + 2.9, 0]}
          center
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(5, 10, 20, 0.93)",
              border: `1px solid ${color}`,
              borderRadius: 6,
              padding: "4px 10px",
              whiteSpace: "nowrap",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: color,
              boxShadow: `0 0 14px ${color}44`,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {node.schema_name}
          </div>
        </Html>
      )}

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
    mid.y += 8;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, t);
    return curve.getPoints(24);
  }, [src.x, src.y, src.z, tgt.x, tgt.y, tgt.z]);

  return (
    <Line
      points={points}
      color="#1a4a6a"
      lineWidth={0.8}
      transparent
      opacity={0.55}
    />
  );
}

// Smoothly animates the camera to focus a selected node
function CameraRig() {
  const { selectedNode } = useGraphStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const flyTo = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    if (!selectedNode) return;

    const target = new THREE.Vector3(selectedNode.x, selectedNode.y, selectedNode.z);

    // Approach from outside — offset along origin→node direction
    const dir = target.clone().normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);

    const size = nodeSize(selectedNode);
    const dist = Math.max(size * 6, 14);
    const pos = target.clone().add(dir.multiplyScalar(dist));

    flyTo.current = { pos, target };
  }, [selectedNode?.id]);

  useFrame((_, delta) => {
    if (!flyTo.current) return;

    const lerpFactor = 1 - Math.pow(0.01, delta * 2);

    camera.position.lerp(flyTo.current.pos, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(flyTo.current.target, lerpFactor);
      controlsRef.current.update();
    }

    // Stop animating once close enough
    if (camera.position.distanceTo(flyTo.current.pos) < 0.05) {
      flyTo.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={400}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

function Scene() {
  const { graphData, searchQuery } = useGraphStore();

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
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 80, 0]} intensity={1.5} color="#00d4ff" />
      <pointLight position={[-80, -30, -50]} intensity={0.7} color="#7c3aed" />
      <Stars radius={300} depth={80} count={4000} factor={4} saturation={0} fade />

      <CameraRig />

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
      camera={{ position: [0, 0, 180], fov: 55 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#050a14" }}
    >
      <Scene />
    </Canvas>
  );
}
