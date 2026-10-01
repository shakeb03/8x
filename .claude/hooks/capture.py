#!/usr/bin/env python3
"""Append each prompt and final response to .agent-logs/<date>_<time>_<session>.md.

Wired to Claude Code hooks in .claude/settings.json:
  UserPromptSubmit -> capture.py prompt    (logs the prompt verbatim)
  Stop             -> capture.py response  (logs the final assistant text of the turn)

Only the prompt and the final response are logged: no thinking, tool calls or
intermediate text. The hook must never block the agent, so every failure is
swallowed and written to .claude/capture-errors.log instead.
"""
import datetime
import fcntl
import glob
import json
import os
import re
import subprocess
import sys
import time
import traceback

TOOL = "claude-code"


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def read_transcript(path):
    entries = []
    if not path or not os.path.exists(path):
        return entries
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                entries.append(json.loads(line))
            except ValueError:
                pass
    return entries


def prompt_text(entry):
    """Return the typed prompt if this transcript entry is a real user prompt, else None."""
    if entry.get("type") != "user" or entry.get("isMeta") or entry.get("isSidechain"):
        return None
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        if any(b.get("type") == "tool_result" for b in content):
            return None
        texts = [b.get("text", "") for b in content if b.get("type") == "text"]
        return "\n".join(texts) if texts else None
    return None


def last_model(entries):
    for e in reversed(entries):
        model = (e.get("message") or {}).get("model")
        if e.get("type") == "assistant" and model and model != "<synthetic>":
            return model
    return None


def launch_model():
    """The --model flag the Claude Code process was started with (desktop app passes it)."""
    try:
        pid = os.environ.get("CLAUDE_PID") or str(os.getppid())
        args = subprocess.run(["ps", "-o", "args=", "-p", pid], capture_output=True, text=True, timeout=2).stdout
        m = re.search(r"--model[ =](\S+)", args)
        return m.group(1) if m else None
    except Exception:
        return None


def final_response(entries):
    """Text of the last assistant message in the turn: text blocks after the last user/tool_result entry."""
    last_user = None
    for i, e in enumerate(entries):
        if e.get("type") == "user" and not e.get("isSidechain"):
            last_user = i
    if last_user is None:
        return None, None, None
    texts, ts, model = [], None, None
    for e in entries[last_user + 1:]:
        if e.get("type") != "assistant" or e.get("isSidechain"):
            continue
        msg = e.get("message") or {}
        for b in msg.get("content") or []:
            if b.get("type") == "text" and b.get("text", "").strip():
                texts.append(b["text"])
                ts = e.get("timestamp")
                model = msg.get("model")
    return ("\n\n".join(texts) if texts else None), ts, model


def git_author(cwd):
    for key in ("github.user", "user.name"):
        try:
            out = subprocess.run(["git", "config", key], cwd=cwd, capture_output=True, text=True, timeout=2).stdout.strip()
            if out:
                return out
        except Exception:
            pass
    return "unknown"


def log_path(log_dir, session_id, first_ts):
    existing = glob.glob(os.path.join(log_dir, "*_%s.md" % session_id))
    if existing:
        return existing[0]
    stamp = datetime.datetime.strptime(first_ts[:19], "%Y-%m-%dT%H:%M:%S").strftime("%Y-%m-%d_%H-%M-%S")
    return os.path.join(log_dir, "%s_%s.md" % (stamp, session_id))


def load_state(state_dir, session_id):
    try:
        with open(os.path.join(state_dir, session_id + ".json")) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"prompts": 0, "last_kind": None, "first_prompt_time": None, "last_prompt_time": None, "models": []}


def save_state(state_dir, session_id, state):
    os.makedirs(state_dir, exist_ok=True)
    with open(os.path.join(state_dir, session_id + ".json"), "w") as f:
        json.dump(state, f)


def render(path, session_id, project, author, state, body):
    first = state["first_prompt_time"] or now_iso()
    last = state["last_prompt_time"] or first
    short = session_id[:8]
    header = (
        "---\n"
        "session_id: %s\n"
        "date: %s\n"
        "author: %s\n"
        "model: %s\n"
        "tool: %s\n"
        "project: %s\n"
        "total_exchanges: %d\n"
        "first_prompt_time: %s\n"
        "last_prompt_time: %s\n"
        "---\n\n"
        "# Session Log - %s\n\n"
        "Session: `%s` | Project: `%s` | Author: `%s`\n\n"
        "---\n"
    ) % (session_id, first[:10], author, ", ".join(state["models"]) or "unknown", TOOL, project,
         state["prompts"], first, last, first[:10], short, project, author)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(header + body)
    os.replace(tmp, path)


def split_body(path):
    """Everything after the generated header (the header never contains a LOG_ENTRY line)."""
    if not os.path.exists(path):
        return ""
    text = open(path, encoding="utf-8").read()
    idx = text.find("\n[LOG_ENTRY ")
    return text[idx:] if idx != -1 else ""


def append(state, body, kind, session_id, ts, model, text):
    if kind == "PROMPT":
        state["prompts"] += 1
        state["first_prompt_time"] = state["first_prompt_time"] or ts
        state["last_prompt_time"] = ts
    state["last_kind"] = kind
    # Header model lists every model seen, in order, so a switch is visible at a glance.
    if model not in state["models"]:
        state["models"].append(model)
    return body + "\n\n[LOG_ENTRY type=%s num=%d session=%s]\ntimestamp: %s\nmodel: %s\n\n%s\n" % (
        kind, max(state["prompts"], 1), session_id[:8], ts, model, text.rstrip("\n"))


def main():
    mode = sys.argv[1]
    payload = json.loads(sys.stdin.read() or "{}")
    session_id = payload.get("session_id") or os.environ.get("CLAUDE_CODE_SESSION_ID") or "unknown"
    transcript = payload.get("transcript_path")
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()
    log_dir = os.environ.get("AGENT_LOG_DIR") or os.path.join(project_dir, ".agent-logs")
    state_dir = os.environ.get("AGENT_STATE_DIR") or os.path.join(project_dir, ".claude", "capture-state")
    os.makedirs(log_dir, exist_ok=True)
    project = os.path.basename(os.path.normpath(project_dir))
    author = git_author(project_dir)

    lock = open(os.path.join(project_dir, ".claude", "capture.lock"), "w")
    fcntl.flock(lock, fcntl.LOCK_EX)
    try:
        entries = read_transcript(transcript)
        state = load_state(state_dir, session_id)

        if mode == "prompt":
            ts = now_iso()
            model = last_model(entries) or launch_model() or "unknown"
            path = log_path(log_dir, session_id, ts)
            body = append(state, split_body(path), "PROMPT", session_id, ts, model, payload.get("prompt", ""))
        else:
            text = payload.get("last_assistant_message")
            t_text, ts, model = final_response(entries)
            # The transcript can lag the Stop event by a moment; retry briefly if we have nothing.
            for _ in range(10):
                if text or t_text:
                    break
                time.sleep(0.3)
                entries = read_transcript(transcript)
                t_text, ts, model = final_response(entries)
            text = text or t_text or "(no final text response in transcript)"
            ts = ts or now_iso()
            model = model or last_model(entries) or launch_model() or "unknown"

            path = log_path(log_dir, session_id, ts)
            body = split_body(path)
            # Backfill the prompt if UserPromptSubmit did not log it (e.g. hook installed mid-turn).
            if state["last_kind"] != "PROMPT":
                for e in reversed(entries):
                    p_text = prompt_text(e)
                    if p_text is not None:
                        body = append(state, body, "PROMPT", session_id, e.get("timestamp") or ts, model, p_text)
                        break
            body = append(state, body, "RESPONSE", session_id, ts, model, text)

        render(path, session_id, project, author, state, body)
        save_state(state_dir, session_id, state)
    finally:
        fcntl.flock(lock, fcntl.LOCK_UN)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        try:
            d = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
            with open(os.path.join(d, ".claude", "capture-errors.log"), "a") as f:
                f.write("%s %s\n%s\n" % (now_iso(), sys.argv, traceback.format_exc()))
        except Exception:
            pass
    sys.exit(0)
