import { attribute, button, div, h3, HtmlNode, on, p, text } from "@eeue56/coed";
import { MigrationTrailEntry, Update } from "../../types";
import { iconDelete } from "./icons";

export function renderRemoveSettings(): HtmlNode<Update> {
  return button(
    [on("click", updateRemoveSettings)],
    [attribute("id", "remove-all-settings")],
    [text("Remove settings (including pills) data"), iconDelete]
  );
}

function updateRemoveSettings(): Update {
  return {
    kind: "RemoveSettings",
  };
}

export function renderRemoveAppState(): HtmlNode<Update> {
  return button(
    [on("click", updateRemoveAppState)],
    [attribute("id", "remove-app-state")],
    [text("Remove app state (including journal entries) data"), iconDelete]
  );
}

function updateRemoveAppState(): Update {
  return {
    kind: "RemoveAppState",
  };
}

export function renderMigrationTrail(
  trailEntries: MigrationTrailEntry[]
): HtmlNode<Update> {
  if (trailEntries.length === 0) {
    return div(
      [],
      [attribute("id", "migration-trail-section")],
      [
        h3([], [], [text("Migration Trail (Backup History)")]),
        p(
          [],
          [],
          [
            text(
              "No migration backups found. Backups are created automatically before database migrations."
            ),
          ]
        ),
      ]
    );
  }

  const sortedEntries = [...trailEntries].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  const entryElements = sortedEntries.map((entry, index) => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleString();
    const entrySize = JSON.stringify(entry.data).length;
    const sizeKB = (entrySize / 1024).toFixed(2);

    return div<Update>(
      [],
      [attribute("class", "migration-trail-entry")],
      [
        p(
          [],
          [attribute("class", "trail-entry-header")],
          [
            text(
              `Backup ${sortedEntries.length - index}: ${entry.storeName} (v${entry.fromVersion} → v${entry.toVersion})`
            ),
          ]
        ),
        p(
          [],
          [attribute("class", "trail-entry-meta")],
          [text(`Date: ${dateStr} | Size: ${sizeKB} KB`)],
        ),
        button<Update>(
          [
            on("click", (): Update => ({
              kind: "DownloadTrailEntry",
              entry,
              index,
            })),
          ],
          [attribute("class", "download-trail-button")],
          [text("Download backup")]
        ),
      ]
    );
  });

  return div(
    [],
    [attribute("id", "migration-trail-section")],
    [
      h3([], [], [text("Migration Trail (Backup History)")]),
      p(
        [],
        [],
        [
          text(
            "These are automatic backups created before database migrations. You can download them to recover data if needed."
          ),
        ]
      ),
      div([], [attribute("class", "migration-trail-entries")], entryElements),
    ]
  );
}
