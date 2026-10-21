# voice-check

A Claude Code mod that adds one slash command, `/voice-check`. It checks that the YouTube Agent
voice profile at `~/.claude/youtube/voice.md` exists and matches the fingerprint (SHA-256) of the
saved profile that my cloud environment's setup script restores.

It only reads. It never writes, moves or deletes any file.

## What it reports

- **✓ MATCHES** — the file is there and is byte-for-byte the saved profile (fingerprint, size and
  last-modified time shown).
- **✗ DIFFERENT** — the file is there but has changed; both fingerprints are shown.
- **✗ MISSING** or **✗ EMPTY** — the setup script's restore block did not run, or something emptied
  the file.

The expected fingerprint is set in `hooks/register.ts` (`EXPECTED`). If `voice.md` is edited on
purpose, update `EXPECTED` and `EXPECTED_BYTES` there, and the restore block in the setup script,
together.

## Install

At the prompt of a terminal session:

```
/plugin install voice-check --marketplace sarczar/yadhu-voice-check
```

Answer `y` to add the marketplace, then press Enter for the user scope.

From a shell:

```
claude plugin install voice-check --marketplace sarczar/yadhu-voice-check
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins,
Add marketplace with `sarczar/yadhu-voice-check`, then Add plugin.

### In every new cloud session

Add these two lines to the end of the environment's setup script (cloud environment menu → Edit →
Setup script), the same way the YouTube Agent plugin is installed:

```
claude plugin marketplace add sarczar/yadhu-voice-check
claude plugin install voice-check@yadhu-voice-check
```

Then type `/voice-check` in a session.

## Files

- `.claude-plugin/plugin.json` — the mod's name and description
- `.claude-plugin/marketplace.json` — makes this repository an install source
- `hooks/hooks.json` — names the hooks module
- `hooks/register.ts` — the `/voice-check` command
- `tests/voice-check.test.ts` — tests for the missing, empty and changed cases (`claude plugin test .`)
- `tsconfig.json` — type-checking settings
