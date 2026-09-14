# Accordion

A collapsible list of items. Each item has a **label** (shown always, click to
toggle) and a **body** (revealed when the item is open). Ideal for FAQs and any
question/answer content. Built on the native `<details>`/`<summary>` element, so
it is keyboard-accessible and works even before JavaScript loads.

## Authoring

Author as a two-column block. The first row is the block name (`Accordion`).
Each subsequent row is one item:

| Accordion | |
| --- | --- |
| Who is WKND's intended audience? | We believe the best adventures are accessible to everyone… |
| How does WKND pay for itself? | WKND charges a small fee for local promoters… |

- **Cell 1** — the label/question. Becomes the clickable summary.
- **Cell 2** — the body/answer. Can hold paragraphs, lists, links, or images.

Multiple items can be open at once; each toggles independently.

## Supported variations

| Variation | Class | Description |
| --- | --- | --- |
| Default | `accordion` | Bordered items with a chevron indicator; the open item shows a yellow accent rule above its body. |
