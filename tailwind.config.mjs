/** @type {import('tailwindcss').Config} */

import t from "@tailwindcss/typography";
import colors from "tailwindcss/colors";
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	darkMode: "selector",
	theme: {
		extend: {
			fontFamily: {
				sans: ['Open Sans Variable', ...defaultTheme.fontFamily.sans],
				headings: ['Outfit Variable', ...defaultTheme.fontFamily.sans]
			},
			colors: {
				// background colors for light mode
				// warmer than zinc
				bright: colors.stone,
				// background colors for dark mode
				// cooler than stone
				dim: colors.zinc,
				legal: colors.amber,
			},
		},
	},
	plugins: [t],
};
