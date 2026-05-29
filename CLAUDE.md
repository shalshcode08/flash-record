# Project conventions for Claude Code

## Git commits

Every commit you create in this repo must include a `Co-Authored-By` trailer for Claude. Use this format (HEREDOC to preserve formatting):

```
git commit -m "$(cat <<'EOF'
<commit subject>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

- Always add the trailer, even for tiny commits.
- Keep it as the final trailer in the message.
- Do not add the trailer to commits you did not author (e.g., when rebasing or cherry-picking someone else's work).
