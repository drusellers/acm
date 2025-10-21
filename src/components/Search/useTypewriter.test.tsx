import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type TypeStep, useTypewriter } from "./useTypewriter";

// Use fake timers to control time-based behavior
afterEach(() => {
	vi.useRealTimers();
});

describe("useTypewriter - type behavior", () => {
	it("types full payload sequentially with default delays", async () => {
		vi.useFakeTimers();

		const script: TypeStep[] = [{ op: "type", text: "abc" }];

		const { result } = renderHook(() =>
			useTypewriter({ script, autostart: true, loop: false }),
		);

		// advance to type first char
		await act(async () => {
			vi.advanceTimersByTime(38);
		});
		expect(result.current.text).toBe("a");

		// second char
		await act(async () => {
			vi.advanceTimersByTime(38);
		});
		expect(result.current.text).toBe("ab");

		// third char
		await act(async () => {
			vi.advanceTimersByTime(38);
		});
		expect(result.current.text).toBe("abc");
	});

	it("respects reduced motion by typing instantly", async () => {
		vi.useFakeTimers();

		// Mock matchMedia for reduced motion
		const original = window.matchMedia;
		// @ts-expect-error - test mock
		window.matchMedia = vi.fn().mockReturnValue({ matches: true });

		const script: TypeStep[] = [{ op: "type", text: "xyz" }];
		const { result } = renderHook(() =>
			useTypewriter({
				script,
				autostart: true,
				loop: false,
				respectReducedMotion: true,
			}),
		);

		// Even with reduced motion, autostart is async; flush microtask timers
		await act(async () => {
			vi.runAllTimers();
		});
		expect(result.current.text).toBe("xyz");

		// restore
		window.matchMedia = original;
	});
});
