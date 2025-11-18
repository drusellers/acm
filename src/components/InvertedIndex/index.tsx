import { Fragment, type KeyboardEvent, useState } from "react";
import {
	lowerCaseToken,
	ngram,
	tokenizer,
} from "../../lib/search/tokenizer.ts";

type Doc = {
	idx: number;
	text: string;
	tokens: string[];
};

export default function InvertedIndex() {
	const [docId, setDocId] = useState(0);
	const [text, setText] = useState("");
	const [docs, setDocs] = useState<Doc[]>([]);
	const [index, setIndex] = useState<Map<string, Set<number>>>(
		new Map<string, Set<number>>(),
	);
	const [orderedKeys, setOrderedKeys] = useState<string[]>([]);

	const [ngramIndex, setNgramIndex] = useState<Map<string, Set<number>>>(
		new Map<string, Set<number>>(),
	);

	const [ngramOrderedKeys, setNgramOrderedKeys] = useState<string[]>([]);
	function handleKeys(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			docs.push({
				idx: docId,
				text: text,
				tokens: [],
			});

			setIndex((old) => {
				const tokens = tokenizer(text).map(lowerCaseToken);

				for (const token of tokens) {
					if (!old.has(token.token)) {
						old.set(token.token, new Set<number>());
					}

					old.get(token.token)?.add(docId);
				}
				const k = old.keys().toArray();
				k.sort();
				setOrderedKeys(k);

				console.log("old", old);
				return structuredClone(old);
			});

			setNgramIndex((old) => {
				const tokens = tokenizer(text)
					.map(lowerCaseToken)
					.flatMap((t) => ngram(t, 3));
				for (const token of tokens) {
					if (!old.has(token.token)) {
						old.set(token.token, new Set<number>());
					}

					old.get(token.token)?.add(docId);
				}
				const k = old.keys().toArray();
				k.sort();
				setNgramOrderedKeys(k);

				return structuredClone(old);
			});

			setText("");
			setDocId((o) => o + 1);
		}
	}

	return (
		<div className={"flex flex-col"}>
			<div>
				<input
					type={"text"}
					value={text}
					className={"border text-lg p-2"}
					onChange={(e) => setText(e.currentTarget.value)}
					onKeyUp={handleKeys}
				/>
			</div>
			<div className={"grid grid-cols-2 gap-4"}>
				<div className={"grid grid-cols-[auto_1fr] gap-2"}>
					{[...docs].map((doc) => {
						return (
							<Fragment key={doc.idx}>
								<div>{doc.idx}.</div>
								<div>{doc.text}</div>
							</Fragment>
						);
					})}
				</div>
				<div className={"flex flex-col gap-4"}>
					<h1 className={"text-xl font-bold"}>Terms</h1>
					<div className={"grid grid-cols-[auto_1fr] gap-2"}>
						{orderedKeys.map((key) => {
							const tokens = index.get(key);
							if (!tokens) return null;
							return (
								<Fragment key={key}>
									<div>{key}:</div>
									<div>{[...tokens].join(", ")}</div>
								</Fragment>
							);
						})}
					</div>

					<h1 className={"text-xl font-bold"}>NGrams</h1>
					<div className={"grid grid-cols-[auto_1fr] gap-2"}>
						{ngramOrderedKeys.map((key) => {
							const tokens = ngramIndex.get(key);
							if (!tokens) return null;
							return (
								<Fragment key={key}>
									<div>{key}:</div>
									<div>{[...tokens].join(", ")}</div>
								</Fragment>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
