# adventure-list

Custom **adventure-list** block. Purpose: Dynamic, filterable grid of adventure cards driven by page metadata.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: a marker block containing links to the adventure pages (or empty when a query-index is published); cards + filter tabs are built at render time from each page's Activity.

## Supported variations

| Variation | Class | Authoring | Behaviour |
| --- | --- | --- | --- |
| Default | `adventure-list` | One row per authored link to an adventure page (or empty when a query-index is published). | Lists the linked pages — or every page under `/us/en/adventures/` when a query-index exists. |
| Children | `adventure-list (children)` | A single cell holding a **parent page path** (link or plain text), e.g. `/us/en/adventures`. No per-page links. | Lists the parent's **direct child pages**, discovered from the query-index by path prefix. Renders **nothing** if the query-index is unavailable or the parent has no children (no authored-link fallback). |

### Children variant authoring example

| adventure-list (children) |
| --- |
| /us/en/adventures |

Both variants read each page's image, title, description, and Activity from the
query-index columns when present, otherwise by fetching the page's
`.plain.html`, and auto-derive the activity filter tabs from the distinct
activities found.

## Universal Editor fields

N/A (Document Authoring project)
