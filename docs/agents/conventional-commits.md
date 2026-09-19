# Conventional commits

How to write git commit messages in this repo. Read this before `git commit`.

Done when the subject matches `type(optional-scope): description`, the type is in the list below, and the description starts lowercase with no trailing period.

Husky `commit-msg` and `pre-push` run commitlint; a message that fails the regex never reaches origin.

## Format

```
type(scope): description

Optional body — why, not what. Body lines stay under 100 characters.
```

`scope` is optional. Use a short kebab-case area when it helps (`link-hub`, `content`, `analytics`, `ci`, `agents`).

| type       | when                                  |
| ---------- | ------------------------------------- |
| `feat`     | visitor-facing behaviour              |
| `fix`      | a bug                                 |
| `docs`     | markdown / agent docs only            |
| `style`    | formatting, no behaviour change       |
| `refactor` | structure, same behaviour             |
| `perf`     | speed / size                          |
| `test`     | tests only                            |
| `build`    | tooling, bundler, deps                |
| `ci`       | GitHub Actions / hooks                |
| `chore`    | maintenance that is none of the above |
| `revert`   | revert a previous commit              |

```
feat(link-hub): extract ascii portrait from the page
fix(seo): share isConfiguredLink with hub-config
docs: add clean-code layout rules
chore: add commitlint on pre-push
```

Subject is imperative and lowercase (`extract`, not `Extract` / `extracted`). Header stays under 100 characters.

## Push

`pre-push` lints every commit in the range being sent to origin, then runs `pnpm test && pnpm test:e2e`. Commits already on the remote are not re-checked. The range lint skips `body-max-line-length`, `subject-empty`, `subject-full-stop`, and `type-empty` so older / merge-style messages can still push; `commit-msg` still enforces the full rules on new commits.
