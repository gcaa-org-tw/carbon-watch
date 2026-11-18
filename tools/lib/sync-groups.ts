export interface ConsumedTab {
  tab: string;
  consumers: string[];
}

export interface SyncGroup {
  consumers: string[];
  tabs: string[];
}

export type TabFetch = { ok: true; csv: string } | { ok: false; error: string };

export type GroupCheck = (csvByTab: ReadonlyMap<string, string>) => void;

export type GroupOutcome =
  | { group: SyncGroup; failure: null; csvByTab: ReadonlyMap<string, string> }
  | { group: SyncGroup; failure: { tab: string; error: string } };

export function groupTabs(tabs: ConsumedTab[]): SyncGroup[] {
  let groups: { consumers: Set<string>; tabs: string[] }[] = [];
  for (const { tab, consumers } of tabs) {
    const touching = groups.filter(group => consumers.some(consumer => group.consumers.has(consumer)));
    groups = groups.filter(group => !touching.includes(group));
    groups.push({
      consumers: new Set([...touching.flatMap(group => [...group.consumers]), ...consumers]),
      tabs: [...touching.flatMap(group => group.tabs), tab],
    });
  }
  const order = tabs.map(({ tab }) => tab);
  const byOrder = (a: string, b: string) => order.indexOf(a) - order.indexOf(b);
  return groups
    .map(group => ({ consumers: [...group.consumers].sort(), tabs: group.tabs.sort(byOrder) }))
    .sort((a, b) => byOrder(a.tabs[0] ?? '', b.tabs[0] ?? ''));
}

export function checkTabValues(values: unknown[][] | null | undefined): string | null {
  if (!values || values.length === 0) {
    return 'tab is empty';
  }
  const firstCell = String(values[0]?.[0] ?? '');
  if (firstCell.startsWith('#') || firstCell === 'Loading...') {
    return `import not resolved (A1 = ${firstCell})`;
  }
  return null;
}

export function decideGroups(
  groups: SyncGroup[],
  fetched: ReadonlyMap<string, TabFetch>,
  checks: Record<string, GroupCheck>
): GroupOutcome[] {
  return groups.map(group => {
    const csvByTab = new Map<string, string>();
    for (const tab of group.tabs) {
      const result = fetched.get(tab) ?? { ok: false, error: 'not fetched' };
      if (!result.ok) {
        return { group, failure: { tab, error: result.error } };
      }
      csvByTab.set(tab, result.csv);
    }
    for (const consumer of group.consumers) {
      const check = checks[consumer];
      if (!check) continue;
      try {
        check(csvByTab);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { group, failure: { tab: `cross-tab check of ${consumer}`, error: message } };
      }
    }
    return { group, failure: null, csvByTab };
  });
}

export function groupLabel(group: SyncGroup): string {
  return group.consumers.map(consumer => consumer.replace(/^tools\/transform-|\.ts$/g, '')).join(', ');
}

export function summarizeOutcomes(outcomes: GroupOutcome[]): string {
  const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const rows = outcomes.map(({ group, failure }) =>
    failure
      ? `| ${cell(groupLabel(group))} | ${group.tabs.length} | skipped | ${cell(failure.tab)} | ${cell(failure.error)} |`
      : `| ${cell(groupLabel(group))} | ${group.tabs.length} | synced | | |`
  );
  return [
    '| Group (transforms) | Tabs | Result | Failed tab | Reason |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}
