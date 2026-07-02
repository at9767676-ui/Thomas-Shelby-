/**
 * CA INTER PLANNER — SUBJECT & CHAPTER DATA
 * Predefined study-hour estimates per chapter drive the Smart Engine.
 * difficulty: 'easy' | 'medium' | 'hard' — used for timer duration & weighting.
 */

const SUBJECTS = [
  {
    id: 'accounts', name: 'Advanced Accounting', short: 'ACC', group: 1, color: 'var(--sub-accounts)',
    chapters: [
      { id: 'acc-01', name: 'Introduction to Accounting Standards', hours: 3, difficulty: 'easy' },
      { id: 'acc-02', name: 'Framework for Preparation of Financial Statements', hours: 3, difficulty: 'easy' },
      { id: 'acc-03', name: 'Applicability of Accounting Standards', hours: 2, difficulty: 'easy' },
      { id: 'acc-04', name: 'AS 1, 2, 4, 5, 10 — Disclosure & Valuation', hours: 8, difficulty: 'medium' },
      { id: 'acc-05', name: 'Company Accounts — Buyback & Bonus Issue', hours: 10, difficulty: 'medium' },
      { id: 'acc-06', name: 'Amalgamation of Companies', hours: 12, difficulty: 'hard' },
      { id: 'acc-07', name: 'Internal Reconstruction', hours: 9, difficulty: 'medium' },
      { id: 'acc-08', name: 'Average Due Date & Account Current', hours: 4, difficulty: 'easy' },
      { id: 'acc-09', name: 'Financial Statements of Companies (Schedule III)', hours: 8, difficulty: 'medium' },
      { id: 'acc-10', name: 'Profit/Loss Prior to Incorporation', hours: 5, difficulty: 'medium' },
      { id: 'acc-11', name: 'Investment Accounts', hours: 6, difficulty: 'medium' },
      { id: 'acc-12', name: 'Insurance Claims for Loss of Stock/Profit', hours: 7, difficulty: 'medium' },
      { id: 'acc-13', name: 'Hire Purchase & Instalment Sale', hours: 8, difficulty: 'medium' },
      { id: 'acc-14', name: 'Departmental Accounts', hours: 5, difficulty: 'easy' },
      { id: 'acc-15', name: 'Branch Accounts incl. Foreign Branch', hours: 9, difficulty: 'medium' },
      { id: 'acc-16', name: 'Accounting for Consolidation of Companies', hours: 14, difficulty: 'hard' },
      { id: 'acc-17', name: 'Dissolution of Partnership Firm', hours: 6, difficulty: 'medium' },
      { id: 'acc-18', name: 'Amalgamation & Conversion of Partnership Firms', hours: 7, difficulty: 'medium' },
    ]
  },
  {
    id: 'law', name: 'Corporate & Other Laws', short: 'LAW', group: 1, color: 'var(--sub-law)',
    chapters: [
      { id: 'law-01', name: 'Preliminary — Companies Act 2013', hours: 2, difficulty: 'easy' },
      { id: 'law-02', name: 'Incorporation of Company & Matters Incidental', hours: 5, difficulty: 'medium' },
      { id: 'law-03', name: 'Prospectus and Allotment of Securities', hours: 6, difficulty: 'medium' },
      { id: 'law-04', name: 'Share Capital and Debentures', hours: 7, difficulty: 'medium' },
      { id: 'law-05', name: 'Acceptance of Deposits by Companies', hours: 4, difficulty: 'easy' },
      { id: 'law-06', name: 'Registration of Charges', hours: 3, difficulty: 'easy' },
      { id: 'law-07', name: 'Management & Administration', hours: 6, difficulty: 'medium' },
      { id: 'law-08', name: 'Declaration and Payment of Dividend', hours: 4, difficulty: 'easy' },
      { id: 'law-09', name: 'Accounts of Companies', hours: 5, difficulty: 'medium' },
      { id: 'law-10', name: 'Audit and Auditors', hours: 5, difficulty: 'medium' },
      { id: 'law-11', name: 'Companies Incorporated Outside India', hours: 3, difficulty: 'easy' },
      { id: 'law-12', name: 'The General Clauses Act, 1897', hours: 4, difficulty: 'easy' },
      { id: 'law-13', name: 'Interpretation of Statutes', hours: 4, difficulty: 'medium' },
      { id: 'law-14', name: 'Foreign Exchange Management Act — Basics', hours: 3, difficulty: 'easy' },
    ]
  },
  {
    id: 'tax', name: 'Taxation', short: 'TAX', group: 1, color: 'var(--sub-tax)',
    chapters: [
      { id: 'tax-01', name: 'Basic Concepts of Income Tax', hours: 4, difficulty: 'easy' },
      { id: 'tax-02', name: 'Residence and Scope of Total Income', hours: 5, difficulty: 'medium' },
      { id: 'tax-03', name: 'Income from Salary', hours: 8, difficulty: 'medium' },
      { id: 'tax-04', name: 'Income from House Property', hours: 6, difficulty: 'medium' },
      { id: 'tax-05', name: 'Profits & Gains of Business or Profession', hours: 12, difficulty: 'hard' },
      { id: 'tax-06', name: 'Capital Gains', hours: 10, difficulty: 'hard' },
      { id: 'tax-07', name: 'Income from Other Sources', hours: 5, difficulty: 'easy' },
      { id: 'tax-08', name: 'Clubbing of Income', hours: 4, difficulty: 'medium' },
      { id: 'tax-09', name: 'Set Off & Carry Forward of Losses', hours: 5, difficulty: 'medium' },
      { id: 'tax-10', name: 'Deductions under Chapter VI-A', hours: 6, difficulty: 'medium' },
      { id: 'tax-11', name: 'Computation of Total Income & Tax Liability', hours: 8, difficulty: 'medium' },
      { id: 'tax-12', name: 'Advance Tax, TDS & TCS', hours: 6, difficulty: 'medium' },
      { id: 'tax-13', name: 'Provisions for Filing Return of Income', hours: 3, difficulty: 'easy' },
      { id: 'tax-14', name: 'GST in India — An Introduction', hours: 4, difficulty: 'easy' },
      { id: 'tax-15', name: 'Supply under GST', hours: 7, difficulty: 'medium' },
      { id: 'tax-16', name: 'Charge of GST', hours: 5, difficulty: 'medium' },
      { id: 'tax-17', name: 'Exemptions from GST', hours: 6, difficulty: 'medium' },
      { id: 'tax-18', name: 'Time and Value of Supply', hours: 8, difficulty: 'medium' },
      { id: 'tax-19', name: 'Input Tax Credit', hours: 9, difficulty: 'hard' },
      { id: 'tax-20', name: 'Registration under GST', hours: 5, difficulty: 'medium' },
      { id: 'tax-21', name: 'Tax Invoice, Credit and Debit Notes', hours: 4, difficulty: 'easy' },
      { id: 'tax-22', name: 'Returns under GST', hours: 5, difficulty: 'medium' },
      { id: 'tax-23', name: 'Payment of Tax', hours: 4, difficulty: 'easy' },
    ]
  },
  {
    id: 'cost', name: 'Cost & Management Accounting', short: 'CMA', group: 1, color: 'var(--sub-cost)',
    chapters: [
      { id: 'cost-01', name: 'Introduction to Cost & Management Accounting', hours: 3, difficulty: 'easy' },
      { id: 'cost-02', name: 'Material Cost', hours: 6, difficulty: 'medium' },
      { id: 'cost-03', name: 'Employee Cost and Direct Expenses', hours: 5, difficulty: 'medium' },
      { id: 'cost-04', name: 'Overheads — Absorption Costing Method', hours: 8, difficulty: 'medium' },
      { id: 'cost-05', name: 'Activity Based Costing', hours: 5, difficulty: 'medium' },
      { id: 'cost-06', name: 'Cost Sheet', hours: 6, difficulty: 'easy' },
      { id: 'cost-07', name: 'Cost Accounting Systems', hours: 5, difficulty: 'medium' },
      { id: 'cost-08', name: 'Unit & Batch Costing', hours: 6, difficulty: 'medium' },
      { id: 'cost-09', name: 'Job & Contract Costing', hours: 7, difficulty: 'medium' },
      { id: 'cost-10', name: 'Process & Operation Costing', hours: 10, difficulty: 'hard' },
      { id: 'cost-11', name: 'Joint Products & By-Products', hours: 5, difficulty: 'medium' },
      { id: 'cost-12', name: 'Service Costing', hours: 6, difficulty: 'medium' },
      { id: 'cost-13', name: 'Standard Costing', hours: 9, difficulty: 'hard' },
      { id: 'cost-14', name: 'Marginal Costing', hours: 9, difficulty: 'hard' },
      { id: 'cost-15', name: 'Budget and Budgetary Control', hours: 7, difficulty: 'medium' },
    ]
  },
  {
    id: 'audit', name: 'Auditing & Ethics', short: 'AUD', group: 2, color: 'var(--sub-audit)',
    chapters: [
      { id: 'aud-01', name: 'Nature, Objective and Scope of Audit', hours: 4, difficulty: 'easy' },
      { id: 'aud-02', name: 'Audit Strategy, Planning and Programme', hours: 5, difficulty: 'medium' },
      { id: 'aud-03', name: 'Risk Assessment and Internal Control', hours: 7, difficulty: 'medium' },
      { id: 'aud-04', name: 'Audit Evidence', hours: 6, difficulty: 'medium' },
      { id: 'aud-05', name: 'Audit of Items of Financial Statements', hours: 9, difficulty: 'medium' },
      { id: 'aud-06', name: 'Audit Documentation', hours: 3, difficulty: 'easy' },
      { id: 'aud-07', name: 'Completion and Review', hours: 4, difficulty: 'easy' },
      { id: 'aud-08', name: 'Audit Report', hours: 6, difficulty: 'medium' },
      { id: 'aud-09', name: 'Special Features of Audit of Different Entities', hours: 6, difficulty: 'medium' },
      { id: 'aud-10', name: 'Audit of Banks', hours: 7, difficulty: 'medium' },
      { id: 'aud-11', name: 'Audit of Different Types of Entities', hours: 5, difficulty: 'medium' },
      { id: 'aud-12', name: 'Ethics and Terms of Audit Engagements', hours: 4, difficulty: 'easy' },
    ]
  },
  {
    id: 'fmsm', name: 'Financial Management & Strategic Management', short: 'FM-SM', group: 2, color: 'var(--sub-fmsm)',
    chapters: [
      { id: 'fm-01', name: 'Scope and Objectives of Financial Management', hours: 3, difficulty: 'easy' },
      { id: 'fm-02', name: 'Types of Financing', hours: 4, difficulty: 'easy' },
      { id: 'fm-03', name: 'Financial Analysis and Planning — Ratio Analysis', hours: 6, difficulty: 'medium' },
      { id: 'fm-04', name: 'Cost of Capital', hours: 7, difficulty: 'medium' },
      { id: 'fm-05', name: 'Capital Structure', hours: 8, difficulty: 'medium' },
      { id: 'fm-06', name: 'Leverages', hours: 6, difficulty: 'medium' },
      { id: 'fm-07', name: 'Investment Decisions — Capital Budgeting', hours: 10, difficulty: 'hard' },
      { id: 'fm-08', name: 'Dividend Decisions', hours: 5, difficulty: 'medium' },
      { id: 'fm-09', name: 'Management of Working Capital', hours: 10, difficulty: 'hard' },
      { id: 'sm-01', name: 'Introduction to Strategic Management', hours: 3, difficulty: 'easy' },
      { id: 'sm-02', name: 'Strategic Analysis: External Environment', hours: 4, difficulty: 'medium' },
      { id: 'sm-03', name: 'Strategic Analysis: Internal Environment', hours: 4, difficulty: 'medium' },
      { id: 'sm-04', name: 'Strategic Choices', hours: 5, difficulty: 'medium' },
      { id: 'sm-05', name: 'Strategy Implementation and Evaluation', hours: 5, difficulty: 'medium' },
    ]
  },
];

// Flat lookup maps, built once.
const CHAPTER_INDEX = {};
const SUBJECT_OF_CHAPTER = {};
SUBJECTS.forEach(sub => {
  sub.chapters.forEach(ch => {
    CHAPTER_INDEX[ch.id] = ch;
    SUBJECT_OF_CHAPTER[ch.id] = sub.id;
  });
});

function getSubject(id){ return SUBJECTS.find(s => s.id === id); }
function getChapter(id){ return CHAPTER_INDEX[id]; }
function getSubjectOfChapter(chapterId){ return getSubject(SUBJECT_OF_CHAPTER[chapterId]); }

// Timer duration (seconds) for the Timed Question Engine, by difficulty — ICAI-level question pacing.
const TIMER_DURATIONS = { easy: 10 * 60, medium: 15 * 60, hard: 20 * 60 };

// Task weight breakdown — must sum to 100 (Progress Formula from spec).
const TASK_WEIGHTS = { theory: 20, questions: 20, pyq: 20, revision: 20, mock: 20 };
// Revision (20%) is split across 3 passes.
const REVISION_SUB_WEIGHT = TASK_WEIGHTS.revision / 3;
