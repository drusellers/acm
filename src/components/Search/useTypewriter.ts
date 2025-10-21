// useTypewriter.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** A single step in the typewriter script */
export type TypeStep =
	| { op: "type"; text: string }
	| { op: "pause"; ms?: number }
	| { op: "backspace"; n?: number }
	| { op: "backspaceWord" }
	| { op: "clear" };

export type UseTypewriterOptions = {
	script: TypeStep[];
	/** ms per typed character (default 38) */
	typeDelay?: number;
	/** ms per deleted character (default 16) */
	backspaceDelay?: number;
	/** Loop the script (default false) */
	loop?: boolean;
	/**
	 * When looping, number of times to repeat the full script.
	 * If undefined and loop=true, repeats forever. Ignored if loop=false.
	 */
	loopCount?: number;
	/** Auto start on mount (default true) */
	autostart?: boolean;
	/** Respect prefers-reduced-motion (skip animation) (default true) */
	respectReducedMotion?: boolean;
	/** Custom word breakers for backspaceWord */
	wordBreakers?: RegExp;
	/** Called once when a (non-looping) run finishes */
	onFinish?: () => void;
};

export type UseTypewriterReturn = {
	text: string;
	isRunning: boolean;
	stepIndex: number;
	/** 0..1 approximate progress within current step (chars processed / total) */
	stepProgress: number;
	start: () => void;
	stop: () => void;
	reset: () => void;
	/** jump to a fresh run (resets then starts) */
	restart: () => void;
};

export function useTypewriter({
	script,
	typeDelay = 38,
	backspaceDelay = 16,
	loop = false,
	loopCount,
	autostart = true,
	respectReducedMotion = true,
	wordBreakers = /[\s.,!?;:()[\]{}"']/,
	onFinish,
}: UseTypewriterOptions): UseTypewriterReturn {
	const timers = useRef<number[]>([]);
	const [text, setText] = useState("");
	const [isRunning, setIsRunning] = useState(autostart);
	const [stepIndex, setStepIndex] = useState(0);
	const [stepProgress, setStepProgress] = useState(0);
	// Monotonic token to ensure only the latest run of an operation is active
	const runTokenRef = useRef(0);
	// Prevent overlapping step execution
	const stepInProgressRef = useRef(false);
	// Track how many full script runs have completed when looping
	const loopsCompletedRef = useRef(0);

	const reducedMotion = useMemo(() => {
		if (!respectReducedMotion || typeof window === "undefined") return false;
		return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
	}, [respectReducedMotion]);

	const clearTimers = useCallback(() => {
		timers.current.forEach((t) => {
			window.clearTimeout(t);
		});
		timers.current = [];
	}, []);

	// schedule helper
	const schedule = useCallback((fn: () => void, ms: number) => {
		const id = window.setTimeout(fn, ms);
		timers.current.push(id);
	}, []);

	const stop = useCallback(() => {
		setIsRunning(false);
		clearTimers();
	}, [clearTimers]);

	const reset = useCallback(() => {
		stop();
		setText("");
		setStepIndex(0);
		setStepProgress(0);
		loopsCompletedRef.current = 0;
	}, [stop]);

	const start = useCallback(() => {
		if (isRunning) return;
		setIsRunning(true);
	}, [isRunning]);

	const restart = useCallback(() => {
		reset();
		setIsRunning(true);
	}, [reset]);

	// Core runners
	const runType = useCallback(
		(payload: string, delay: number, onDone: () => void) => {
			const textToType =
				typeof payload === "string" ? payload : String(payload ?? "");
			const myToken = ++runTokenRef.current;
			if (reducedMotion || delay <= 0) {
				setText((t) => t + textToType);
				setStepProgress(1);
				schedule(() => {
					if (runTokenRef.current !== myToken) return;
					onDone();
				}, 0);
				return;
			}
			let i = 0;
			const tick = () => {
				if (runTokenRef.current !== myToken) return; // stale run
				if (i >= textToType.length) {
					schedule(() => {
						if (runTokenRef.current !== myToken) return;
						onDone();
					}, 0);
					return;
				}
				// Use charAt to avoid accidental "undefined" concatenation on out-of-bounds
				const nextChar = textToType.charAt(i);
				if (nextChar.length === 0) {
					schedule(() => {
						if (runTokenRef.current !== myToken) return;
						onDone();
					}, 0);
					return;
				}
				setText((t) => t + nextChar);
				i += 1;
				setStepProgress(i / textToType.length);
				if (i < textToType.length && isRunning) {
					schedule(tick, delay);
				} else {
					schedule(() => {
						if (runTokenRef.current !== myToken) return;
						onDone();
					}, 0);
				}
			};
			schedule(tick, delay);
		},
		[isRunning, schedule, reducedMotion],
	);

	const runBackspace = useCallback(
		(n: number, delay: number, onDone: () => void) => {
			const myToken = ++runTokenRef.current;
			if (reducedMotion || delay <= 0 || n <= 0) {
				setText((t) => t.slice(0, Math.max(0, t.length - n)));
				setStepProgress(1);
				schedule(() => {
					if (runTokenRef.current !== myToken) return;
					onDone();
				}, 0);
				return;
			}
			let i = 0;
			const tick = () => {
				if (runTokenRef.current !== myToken) return;
				setText((t) => t.slice(0, -1));
				i += 1;
				setStepProgress(i / n);
				if (i < n && isRunning) {
					schedule(tick, delay);
				} else {
					schedule(() => {
						if (runTokenRef.current !== myToken) return;
						onDone();
					}, 0);
				}
			};
			schedule(tick, delay);
		},
		[isRunning, schedule, reducedMotion],
	);

	const runBackspaceWord = useCallback(
		(onDone: () => void) => {
			// compute characters to delete to remove the final word (plus trailing spaces)
			let toDelete = 0;
			setText((current) => {
				let t = current;
				// trailing spaces
				while (t.endsWith(" ")) {
					toDelete += 1;
					t = t.slice(0, -1);
				}
				// word characters
				while (t.length && !wordBreakers.test(t[t.length - 1])) {
					toDelete += 1;
					t = t.slice(0, -1);
				}
				return current;
			});
			runBackspace(toDelete, backspaceDelay, onDone);
		},
		[backspaceDelay, runBackspace, wordBreakers],
	);

	const advance = useCallback(() => {
		if (!isRunning) return;
		if (stepInProgressRef.current) return;

		// finished the script?
		if (stepIndex >= script.length) {
			if (loop) {
				// If loopCount is undefined, loop forever
				if (typeof loopCount === "undefined") {
					setStepIndex(0);
					setStepProgress(0);
					schedule(() => advanceRef.current(), 0);
				} else {
					const nextCount = loopsCompletedRef.current + 1;
					if (nextCount >= Math.max(0, loopCount)) {
						setIsRunning(false);
						onFinish?.();
					} else {
						loopsCompletedRef.current = nextCount;
						setStepIndex(0);
						setStepProgress(0);
						schedule(() => advanceRef.current(), 0);
					}
				}
			} else {
				setIsRunning(false);
				onFinish?.();
			}
			return;
		}

		setStepProgress(0);
		const step = script[stepIndex];

		const next = () => {
			stepInProgressRef.current = false;
			setStepIndex((i) => i + 1);
			schedule(() => advanceRef.current(), 0);
		};

		switch (step.op) {
			case "type":
				stepInProgressRef.current = true;
				runType(step.text ?? "", typeDelay, next);
				break;
			case "clear": {
				// clear immediately, then advance
				setStepProgress(1);
				stepInProgressRef.current = true;
				setText("");
				schedule(next, 0);
				break;
			}
			case "pause": {
				const ms = reducedMotion ? 0 : Math.max(0, step.ms ?? 500);
				if (ms === 0) {
					setStepProgress(1);
					stepInProgressRef.current = true;
					schedule(next, 0);
				} else {
					// simulate progress during pause
					const startAt = performance.now();
					const dur = ms;
					const tick = () => {
						const elapsed = performance.now() - startAt;
						setStepProgress(Math.min(1, elapsed / dur));
						if (elapsed < dur && isRunning) {
							schedule(tick, 50);
						} else {
							stepInProgressRef.current = true;
							schedule(next, 0);
						}
					};
					schedule(tick, 50);
				}
				break;
			}
			case "backspace": {
				// n defaults to 1
				const n = Math.max(0, step.n ?? 1);
				stepInProgressRef.current = true;
				runBackspace(n, backspaceDelay, next);
				break;
			}
			case "backspaceWord":
				stepInProgressRef.current = true;
				runBackspaceWord(next);
				break;
		}
	}, [
		isRunning,
		stepIndex,
		script,
		loop,
		onFinish,
		schedule,
		runType,
		runBackspace,
		runBackspaceWord,
		typeDelay,
		backspaceDelay,
		reducedMotion,
		loopCount,
	]);

	// Keep latest advance in a ref to prevent stale closures in scheduled callbacks
	const advanceRef = useRef<() => void>(() => {});
	useEffect(() => {
		advanceRef.current = advance;
	}, [advance]);

	// Run/cleanup
	useEffect(() => {
		if (!autostart) return;
		setIsRunning(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autostart]); // only on mount

	useEffect(() => {
		if (!isRunning) {
			clearTimers();
			return clearTimers;
		}
		// Only kick off the runner if no timers are currently scheduled
		if (timers.current.length === 0) {
			schedule(() => advanceRef.current(), 0);
		}
		return clearTimers;
	}, [isRunning, schedule, clearTimers]);

	return {
		text,
		isRunning,
		stepIndex,
		stepProgress,
		start,
		stop,
		reset,
		restart,
	};
}
