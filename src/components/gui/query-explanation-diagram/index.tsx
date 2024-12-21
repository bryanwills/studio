import { Edge, Node, Position, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { buildQueryExplanationFlow, ExplanationMysql } from "./buildQueryExplanationFlow";
import { QueryBlock } from "./node-type/query-block";
import { NestedLoop } from "./node-type/nested-loop";
import { TableBlock } from "./node-type/table-block";

interface LayoutFlowProps {
  items: ExplanationMysql;
}

function QueryExplanationFlow(props: LayoutFlowProps) {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeTypes = useMemo(() => ({
    QUERY_BLOCK: QueryBlock,
    NESTED_LOOP: NestedLoop,
    TABLE: TableBlock
  }), [])

  useEffect(() => {
    if (loading) {
      const build = buildQueryExplanationFlow(props.items as unknown as ExplanationMysql);
      setNodes(build.nodes.map((node: any) => ({
        ...node,
        sourcePosition: node.sourcePosition as Position,
        targetPosition: node.targetPosition as Position
      })))
      setEdges(build.edges as Edge[])
      setLoading(false)
    }
  }, [props, loading])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      nodeTypes={nodeTypes}
      maxZoom={1}
      minZoom={1}
    >

    </ReactFlow>
  )
}

export default function QueryExplanationDiagram(props: LayoutFlowProps) {
  return (
    <ReactFlowProvider>
      <QueryExplanationFlow {...props} />
    </ReactFlowProvider>
  );
}