# Generated DB Schema

> Source of truth exported from migration tooling. Regenerate after schema updates.

```
# entity: Task
- id (uuid, pk)
- title (text)
- status (enum: todo|active|blocked|done)
- created_at (timestamptz)
- updated_at (timestamptz)
```
