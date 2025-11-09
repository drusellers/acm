import { useMemo } from "react";
import { type TypeStep, useTypewriter } from "./useTypewriter.ts";

type Props = {
	loop?: boolean;
	autostart?: boolean;
	showControls?: boolean;
};

const workoutScript: TypeStep[] = [
	{ op: "clear" },
	{ op: "type", text: "best strength program for runners" },
	{ op: "pause", ms: 1600 },
	{ op: "backspace", n: 8 }, // remove "runners"
	{ op: "type", text: " sprinters" },
	{ op: "pause", ms: 700 },
	{ op: "backspaceWord" },
	{ op: "type", text: " masters athletes 40+" },
	{ op: "pause", ms: 800 },
	{ op: "backspace", n: 4 }, // remove " 40+"
	{ op: "type", text: " 45+" },
	{ op: "pause", ms: 800 },
];
const clothingScript: TypeStep[] = [
	{ op: "clear" },
	{ op: "type", text: "can I fit in a LG?" },
	{ op: "pause", ms: 600 },
	{ op: "backspace", n: 3 }, // remove "LG?"
	{ op: "pause", ms: 600 },
	{ op: "type", text: "XL?" },
	{ op: "pause", ms: 600 },
];
const mayorSearch: TypeStep[] = [
	{ op: "clear" },
	{ op: "type", text: "who is the governor of austin?" },
	{ op: "pause", ms: 600 },
	{ op: "backspace", n: 7 }, // remove "austin?"
	{ op: "pause", ms: 600 },
	{ op: "type", text: "texas?" },
	{ op: "pause", ms: 600 },
];

export default function SearchRevolver({
	loop = true,
	autostart = true,
	showControls = true,
}: Props) {
	const script = useMemo<TypeStep[]>(
		() => [...workoutScript, ...clothingScript, ...mayorSearch],
		[],
	);

	const { text, isRunning, restart, start, stop } = useTypewriter({
		script,
		backspaceDelay: 16,
		loop,
		autostart,
		respectReducedMotion: true,
		loopCount: 2,
	});

	return (
		<div className={"relative pointer-events-none"}>
			{/* Faux input */}
			<div
				aria-hidden="true"
				className="flex h-14 items-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950/95 px-3 text-[16px] leading-[1.5] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] font-mono select-none"
			>
				<span className="whitespace-pre-wrap">{text}</span>
				{/* Caret */}
				{isRunning && (
					<span className="ml-0.5 inline-block h-[1.1em] w-[2px] bg-current animate-[blink_1s_steps(2,start)_infinite]" />
				)}
			</div>

			{/* Controls (clickable) */}
			{showControls && (
				<div className="pointer-events-auto absolute bottom-1 right-1 flex gap-2">
					{isRunning ? (
						<button
							type="button"
							onClick={stop}
							className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
						>
							Pause
						</button>
					) : (
						<button
							type="button"
							onClick={start}
							className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
						>
							Play
						</button>
					)}
					<button
						type="button"
						onClick={restart}
						disabled={isRunning}
						className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
					>
						Restart
					</button>
				</div>
			)}

			{/* Inline keyframes for caret blink */}
			<style>{`@keyframes blink{50%{opacity:0}}`}</style>
		</div>
	);
}
