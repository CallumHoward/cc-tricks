export type CodeLang = "json" | "yaml" | "sh";

export type TokenKind =
  | "key"
  | "string"
  | "number"
  | "literal"
  | "punct"
  | "comment"
  | "command"
  | "flag"
  | "plain";

export type Token = { kind: TokenKind; text: string };

/** Ordered rules per language; the first rule matching at the cursor wins. */
type Rule = { kind: TokenKind | ((m: RegExpExecArray, rest: string) => TokenKind); re: RegExp };

const STRING = /^"(?:[^"\\]|\\.)*"?/;
const SPACE = /^\s+/;

const JSON_RULES: readonly Rule[] = [
  { re: SPACE, kind: "plain" },
  { re: STRING, kind: (_, rest) => (/^\s*:/.test(rest) ? "key" : "string") },
  { re: /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, kind: "number" },
  { re: /^(?:true|false|null)\b/, kind: "literal" },
  { re: /^[{}[\],:]/, kind: "punct" },
];

const YAML_RULES: readonly Rule[] = [
  { re: SPACE, kind: "plain" },
  { re: /^#.*/, kind: "comment" },
  { re: /^(?:---|\.\.\.)$/, kind: "punct" },
  { re: /^-(?=\s)/, kind: "punct" },
  { re: /^[\w.-]+(?=:(?:\s|$))/, kind: "key" },
  { re: /^:(?=\s|$)/, kind: "punct" },
  { re: /^(?:"(?:[^"\\]|\\.)*"?|'[^']*'?)/, kind: "string" },
  { re: /^-?\d+(?:\.\d+)?(?=\s|$)/, kind: "number" },
  { re: /^(?:true|false|null|yes|no)(?=\s|$)/, kind: "literal" },
  { re: /^[^\s#]+(?:\s+[^\s#]+)*/, kind: "plain" },
];

const SH_RULES: readonly Rule[] = [
  { re: SPACE, kind: "plain" },
  { re: /^#.*/, kind: "comment" },
  { re: /^(?:"(?:[^"\\]|\\.)*"?|'[^']*'?)/, kind: "string" },
  { re: /^--?[\w-]+/, kind: "flag" },
  { re: /^<[^>\s]+>/, kind: "literal" },
  { re: /^[^\s"']+/, kind: "plain" },
];

const RULES: Record<CodeLang, readonly Rule[]> = {
  json: JSON_RULES,
  yaml: YAML_RULES,
  sh: SH_RULES,
};

/** Splits one line of code into highlight tokens; the tokens' text always rejoins to `line`. */
export function tokenizeLine(line: string, lang: CodeLang): Token[] {
  const tokens: Token[] = [];
  let rest = line;
  while (rest.length > 0) {
    const token = nextToken(rest, RULES[lang]);
    tokens.push(token);
    rest = rest.slice(token.text.length);
  }
  if (lang === "sh") markCommand(tokens);
  return tokens;
}

function nextToken(rest: string, rules: readonly Rule[]): Token {
  for (const { re, kind } of rules) {
    const m = re.exec(rest);
    if (!m || m[0] === "") continue;
    const after = rest.slice(m[0].length);
    return { kind: typeof kind === "function" ? kind(m, after) : kind, text: m[0] };
  }
  return { kind: "plain", text: rest.charAt(0) };
}

/** The first word of a shell line is the command. */
function markCommand(tokens: Token[]): void {
  const first = tokens.find((t) => t.text.trim() !== "");
  if (first?.kind === "plain") first.kind = "command";
}

/** Fence or block language names mapped to a supported highlighter. */
export function codeLang(name: string | undefined): CodeLang | undefined {
  switch ((name ?? "").toLowerCase()) {
    case "json":
    case "jsonc":
      return "json";
    case "yaml":
    case "yml":
      return "yaml";
    case "sh":
    case "shell":
    case "bash":
    case "zsh":
      return "sh";
    default:
      return undefined;
  }
}
