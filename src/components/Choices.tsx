import { type Edge, ReactFlow } from "@xyflow/react";
import React from "react";
import "@xyflow/react/dist/style.css";

const choices = [
	"Language",
	"UI Framework",
	"DB",
	"SCM",
	"Cloud",
	"LLM",
	"CSS",
	"HTML",
	"CDN",
	"SQL",
	"i18n",
	"B",
];

const initialNodes = [
	{ id: "1", position: { x: 0, y: 0 }, data: { label: "Language" } },
	{ id: "2", position: { x: 100, y: 100 }, data: { label: "UI" } },
	{ id: "3", position: { x: 300, y: 100 }, data: { label: "Database" } },
];
const initialEdges: Edge[] = [
	{ id: "e1-2", source: "1", target: "2" },
	{ id: "e1-3", source: "1", target: "3" },
];
export function ChoicesO() {
	return (
		<div className="bg-red-100 h-[200px]">
			<ReactFlow nodes={initialNodes} edges={initialEdges} />
		</div>
	);
}

export default function Choices() {
	return (
		<div className="grid grid-cols-4 gap-2">
			{choices.map((c) => {
				return (
					<div
						key={c}
						className={
							"flex items-center justify-center text-xs rounded  bg-white dark:bg-dim-800 font-mono px-4 py-2 hover:bg-blue-100"
						}
					>
						{c}
					</div>
				);
			})}
		</div>
	);
}
