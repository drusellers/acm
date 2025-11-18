export type Token = {
	idx: number;
	token: string;
};

export function tokenizer(input: string): Token[] {
	const parts = input.split(" ");
	return parts.map((t, i) => ({ idx: i, token: t }));
}

export function lowerCaseToken(input: Token): Token {
	return {
		idx: input.idx,
		token: input.token.toLowerCase(),
	};
}

export function ngram(input: Token, size: number): Token[] {
	const grams = [];
	for (let i = 0; i <= input.token.length - size; i++) {
		grams.push(input.token.slice(i, i + size));
	}

	return grams.map((g) => {
		return {
			idx: input.idx,
			token: g,
		};
	});
}
