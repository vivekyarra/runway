export const publicReplay = {
  title: 'One issue. Three implementations. Two duplicate-work closures.',
  summary: 'These contributors were human, not AI agents. The replay proves a real duplicate-implementation failure shape and exact overlap; it does not claim agent-collision prevalence.',
  source: {
    repository: 'public JS linter',
    repositoryUrl: 'https://github.com/eslint/eslint',
    issue: '#20014',
    issueUrl: 'https://github.com/eslint/eslint/issues/20014',
    license: 'MIT',
    capturedAt: '2026-07-19',
  },
  records: [
    {
      label: 'PR #20248',
      url: 'https://github.com/eslint/eslint/pull/20248',
      opened: '25 OCT 2025',
      outcome: 'Existing implementation lane',
      state: 'active when later work opened',
    },
    {
      label: 'PR #20487',
      url: 'https://github.com/eslint/eslint/pull/20487',
      opened: '07 FEB 2026',
      outcome: 'Duplicate-work closure',
      state: 'closed 15 Feb',
    },
    {
      label: 'PR #20526',
      url: 'https://github.com/eslint/eslint/pull/20526',
      opened: '20 FEB 2026',
      outcome: 'Duplicate-work closure',
      state: 'closed 40 minutes later',
    },
  ],
  evidence: {
    sharedPaths: 4,
    primaryPath: 'lib/rules/no-use-before-define.js',
    sharedSymbol: 'isEvaluatedDuringInitialization',
    ranges: [
      {
        label: 'PR #20248',
        base: 'aeed0078ca2f73d4744cc522102178d45b5be64e',
        head: '7c7661a9bf195172ca0dd48745f0a0bba37bbf4e',
      },
      {
        label: 'PR #20487',
        base: '8330d238ae6adb68bb6a1c9381e38cfedd990d94',
        head: '479a9fd7a67b142d01994c6ef22179b3a53f04b5',
      },
    ],
    receipt: '690814f55c81bd9b3c0224f53cbe827551c82287c1e93d55c65c72c7d92e8d9e',
    artifact: 'docs/replays/eslint-20014.json',
  },
  disclosure: 'Counterfactual replay: human-authored Git changes stand in for scopes that should have been declared. It proves overlap existed; Runway was not deployed there and this is not agent-scale prevalence data.',
  agentBasis: 'Official Codex guidance separately warns that parallel write-heavy agent workflows can create conflicts and increase coordination overhead.',
  buildMode: {
    builtWith: 'Codex + GPT-5.6-terra',
    runtime: 'Deterministic / no model call',
  },
  attribution: 'Factual public metadata and MIT-licensed source identifiers. Runway is not affiliated with or endorsed by the source project, its foundation, or contributors.',
}
