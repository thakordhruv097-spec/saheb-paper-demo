---
name: andrej-karpathy-skills
description: >-
  Behavioral engineering guidelines derived from Andrej Karpathy's LLM coding principles:
  Think Before Coding, Simplicity First, Surgical Changes, and Goal-Driven Execution.
---

# Andrej Karpathy Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes and enforce senior engineering discipline.

**Tradeoff:** These guidelines bias toward caution, simplicity, and surgical precision over speed.

---

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- **State your assumptions explicitly:** If uncertain about requirements or user intent, ask rather than guess.
- **Present multiple interpretations:** If ambiguity exists, outline the options instead of picking silently.
- **Push back when warranted:** If a simpler, more idiomatic approach exists, explain why.
- **Stop when confused:** If requirements conflict or code is unclear, stop immediately and ask for clarification.

---

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- **No speculative features:** Implement only what was requested.
- **No single-use abstractions:** Do not create wrapper classes, utility helpers, or configs for code used once.
- **No unrequested configurability:** Avoid over-generalized generic architectures.
- **No defensive code for impossible scenarios:** Write clean, straightforward logic.
- **Simplify and condense:** If 200 lines could be written in 50 clean lines, rewrite it.

*Self-Test:* "Would a senior software engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- **Preserve adjacent code:** Do not modify unrelated comments, formatting, or imports.
- **Avoid drive-by refactoring:** Do not refactor code that is working correctly unless explicitly asked.
- **Match existing patterns:** Adhere to the established repository conventions and styling.
- **Flag unrelated dead code:** If dead code is spotted, mention it to the user rather than silently deleting it.

---

## 4. Goal-Driven Execution
**Define verifiable success criteria before running.**

- **Turn tasks into verifiable steps:**
  - *"Add validation"* → Define the valid/invalid boundary checks, then implement.
  - *"Fix the bug"* → Identify root cause, verify reproduction, then apply minimal fix.
  - *"Refactor X"* → Verify all builds and tests pass cleanly before and after.
- **Loop until verified:** Always verify builds and runtime integrity before concluding.
