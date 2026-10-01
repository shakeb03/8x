# Capture Test

Status: **green**. Two separate sessions logged their canary prompt and its response automatically.

## Tool and model

- **Tool:** Claude Code 2.1.284, running in the Claude desktop app (Code tab).
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`, medium effort). The same model plans and executes. No subagents, no other models.
- **Automatic mechanism available:** yes. Claude Code lifecycle hooks.

## Mechanism

Project-level Claude Code hooks, committed in the repo so every session in this folder picks them up:

- **Config file changed:** [`.claude/settings.json`](.claude/settings.json)
  - `UserPromptSubmit` → `python3 .claude/hooks/capture.py prompt`: logs the prompt verbatim (from the hook's `prompt` field) with a UTC timestamp.
  - `Stop` → `python3 .claude/hooks/capture.py response`: reads the session transcript (the `transcript_path` the hook receives) and logs only the final assistant message of the turn. Thinking, tool calls and earlier text from the same turn are left out.
- **Script:** [`.claude/hooks/capture.py`](.claude/hooks/capture.py) (Python 3 standard library only).
  - Writes `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md` in the format from the brief and rewrites the frontmatter (exchange count, prompt times, models seen) on every entry.
  - **Model:** the hook input doesn't include it, so each response records the model from its transcript entry (`message.model`). That's the model that actually answered, so a mid-build switch shows up. Prompts use the latest model in the transcript. For the first prompt of a session, they fall back to the `--model` flag the desktop app launches Claude Code with.
  - If `UserPromptSubmit` didn't log a prompt, the `Stop` hook recovers it from the transcript.
  - Never blocks the agent. Errors go to `.claude/capture-errors.log` (gitignored, currently empty).
- **Gitignored:** only `.claude/capture.lock`, `.claude/capture-errors.log` and `.claude/capture-state/` (per-session counters). `.agent-logs/` is **not** ignored.

## Log files the canaries landed in

- Session 1 (the session that installed the hook): `.agent-logs/2026-10-01_18-26-53_e3121383-6ebd-470c-b0f9-e8c199452f75.md`
- Session 2 (a fresh session): `.agent-logs/2026-10-01_18-38-20_50765e0e-6ec5-4fac-8c3e-2e3a63ef6ac8.md`

## Canary entries (raw)

### Session 1: `e3121383`

```
[LOG_ENTRY type=PROMPT num=2 session=e3121383]
timestamp: 2026-10-01T18:36:05.551Z
model: claude-opus-5-5

CAPTURE TEST — 8x assignment, Shakeb


[LOG_ENTRY type=RESPONSE num=2 session=e3121383]
timestamp: 2026-10-01T18:36:23.573Z
model: claude-opus-5-5

The canary works in this session, but the response half can't be confirmed yet.

**Already in [.agent-logs/2026-10-01_18-26-53_e3121383-6ebd-470c-b0f9-e8c199452f75.md](.agent-logs/2026-10-01_18-26-53_e3121383-6ebd-470c-b0f9-e8c199452f75.md):**
- **Entry 1:** your setup prompt and my full final reply to it, recovered from the transcript when that turn ended. It's only the final reply, with none of the text I wrote along the way. The app picked up the hooks I added mid-session, so this exchange made it in after all.
- **Entry 2:** your canary prompt, `CAPTURE TEST — 8x assignment, Shakeb`, logged at 18:36:05 UTC with the model `claude-opus-5-5`.

**Not yet confirmed:** the reply to entry 2 is written when this turn ends, so I'll check it next turn.

**One quirk for `CAPTURE-TEST.md`:** the log filename says `18-26-53`, which is when entry 1 was recovered, not when you sent the first prompt (18:23:16). That's only because the hooks arrived mid-session. In a new session, the first prompt is logged as soon as you send it, so the filename matches. I'm leaving the file as it is so the log isn't edited after the fact.

**Next:** start a **new session** in this repo and send the canary there. Then come back here and tell me it's done. I'll check that both sessions' prompts and responses landed, write `CAPTURE-TEST.md` with the raw entries, and commit it together with the logs.
```

### Session 2: `50765e0e`

```
[LOG_ENTRY type=PROMPT num=1 session=50765e0e]
timestamp: 2026-10-01T18:38:20.271Z
model: claude-opus-5-5

CAPTURE TEST — 8x assignment, shakeb


[LOG_ENTRY type=RESPONSE num=1 session=50765e0e]
timestamp: 2026-10-01T18:38:27.944Z
model: claude-opus-5-5

The prompt hook is working. It created [.agent-logs/2026-10-01_18-38-20_50765e0e-….md](.agent-logs/2026-10-01_18-38-20_50765e0e-6ec5-4fac-8c3e-2e3a63ef6ac8.md) for this session and logged your prompt as entry 1, along with the session ID, author `shakeb03`, the model and a timestamp.

The response hook only runs after this reply ends, so I can't check it yet. Open the file once I'm done; my response should be there as a second entry.

Also, `.agent-logs/` is still untracked in git. You'll want to either commit it or add it to `.gitignore`, depending on whether the assignment needs the logs.
```

## What I tried first that didn't work, and other notes

- **A headless end-to-end test with `claude -p`:** I tried this before any canary to see real hook input instead of guessing at its fields. It failed with `Not logged in`: the standalone CLI (2.1.221) on this machine isn't logged in, because the desktop app uses its own login. It still fired `SessionStart` and `UserPromptSubmit`, which showed that **neither hook's input includes the model**. That's why the model comes from the transcript and the launch flag. The `Stop` input couldn't be observed this way, so the script uses its `last_assistant_message` field when present and otherwise reads the transcript, retrying briefly in case the transcript is written a moment after the hook fires. I removed the temporary dump hook afterwards.
- **Counting entries by re-reading the log:** this was my first version, and a test showed it was fragile. A prompt containing a line like `[LOG_ENTRY type=PROMPT num=99 …]` (likely, since the format spec has examples and logs may get pasted back in) would have thrown off the numbering. Counts now live in a separate state file. I re-tested with a spoofed entry and the numbering stayed correct.
- **Hook installed mid-session:** the setup prompt was sent before the hooks existed. The desktop app picked up the new `.claude/settings.json` without a restart, and the `Stop` hook recovered that first exchange from the transcript. Because the file was created at that `Stop` (18:26:53), session 1's filename timestamp is later than its `first_prompt_time` (18:23:16). In normal sessions they match, as session 2 shows. I've left this as it is rather than renaming the file.
- **A wrong suggestion in the log:** session 2's reply suggested possibly adding `.agent-logs/` to `.gitignore`. That contradicts the brief and wasn't done. The entry stays as logged.
