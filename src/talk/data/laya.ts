/** Laya playground run, preset "Billing email (example)", one request. */
const LAYA_RUN = {
  _capture: {
    source:
      "http://127.0.0.1:8000/ playground, preset 'Billing email (example)', Run request pressed once",
    http: "200, 1.0 KB",
    roundTripSeconds: 15.76,
    inputTokens: 348,
    outputTokens: 0,
    engine: "laya-rl-agent",
    routedModel: "english",
    routeReason: "English Latin text",
    detected: "en / latin",
  },
  state: {
    from: "user@acme.com",
    subject: "Duplicate charge on invoice #4411",
    body: "Hi, we were billed twice for March. Please refund the duplicate today or we will cancel our plan.",
  },
  answers: {
    department: {
      type: "choice",
      answer: "billing",
      probabilities: {
        billing: 0.9653,
        technical: 0.014,
        sales: 0.0101,
        other: 0.0107,
      },
      answer_confidence: 0.9653,
      confidence_entropy_uncalibrated: 0.864,
    },
    urgency: {
      type: "score",
      score: 1.44,
      label: "critical deadline or blocking issue (55.6%)",
      probabilities: {
        "not urgent": 0.1164,
        soon: 0.3271,
        "critical deadline or blocking issue": 0.5565,
      },
      answer_confidence: 0.5565,
      confidence_entropy_uncalibrated: 0.1425,
    },
    churn_risk: {
      type: "noul",
      answer: true,
      p_true: 0.8248,
      answer_confidence: 0.8248,
    },
    refund_requested: {
      type: "noul",
      answer: true,
      p_true: 0.843,
      answer_confidence: 0.843,
    },
  },
} as const;

export type LayaBar = { id: string; label: string; answer: string; p: number };

/** The four on-screen bars, values straight from the run. */
export const LAYA_BARS: readonly LayaBar[] = [
  {
    id: "department",
    label: "department",
    answer: "billing",
    p: LAYA_RUN.answers.department.answer_confidence,
  },
  {
    id: "urgency",
    label: "urgency",
    answer: "critical",
    p: LAYA_RUN.answers.urgency.answer_confidence,
  },
  { id: "churn_risk", label: "churn risk", answer: "yes", p: LAYA_RUN.answers.churn_risk.p_true },
  {
    id: "refund_requested",
    label: "refund requested",
    answer: "yes",
    p: LAYA_RUN.answers.refund_requested.p_true,
  },
];

export const LAYA_INPUT = LAYA_RUN.state.subject;
