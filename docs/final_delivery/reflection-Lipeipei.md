# Individual Reflection — Lipeipei Sun
**CS7180 Project 3 — BypassHire**
**2026-04-21**

---

## What I Was Trying to Build — and Why the Tooling Mattered

For BypassHire, I was responsible for the full-stack infrastructure: the server setup, authentication (Clerk), the comprehensive CI/CD pipeline, and the overall frontend design. My goal wasn't just to get the app running, but to build a robust, production-ready foundation that would allow my teammate Qi to focus entirely on the core AI tailoring logic without worrying about deployment or regressions. Early on, I realized that managing this level of complexity required more than just writing code—it required establishing a repeatable workflow. This is where Claude Code came in, though adopting it was a journey of balancing steep setup costs against long-term automation benefits.

## One Feature That Paid Off: Building Custom SKILLs and Automation

The most significant payoff from Claude Code was the extensibility of custom SKILLs and the CI/CD pipeline integration. It took substantial upfront effort to define the project's logic into reusable tools (like our `/fix-issue` skill) and to establish strict branch verification and testing rules within our workflow. However, once that infrastructure was in place, the speed of development accelerated noticeably. We had confidence that PRs passing our 9-stage CI pipeline were stable, and the custom skills helped mechanically enforce our formatting and testing standards across every commit without manual nagging.

## One Limitation I Hit: The High Cost of Initial Setup

A major realization for me was the sheer amount of time it takes to set up Claude Code effectively. Before you can reap the benefits of AI-assisted task execution, you must heavily invest in writing `CLAUDE.md` guidelines, configuring hooks, writing custom agent prompts, and testing the agent's behavior. Initially, it felt like I was spending more time "programming the tool" than programming the application. It required a mental shift from immediate coding to systems-thinking, and the barrier to entry can feel frustratingly high if you are on a tight deadline.

## What I Am Taking Forward

I learned that AI coding tools are not "plug-and-play" magic; their utility is directly proportional to how much contextual instruction you encode into them. While the setup phase for Claude was time-consuming, the dividends it paid in maintaining code quality, consistent test execution, and unblocking my teammate ultimately made it worthwhile. Going forward into future projects, I will continue to invest time in early infrastructure and CI/CD pipelines, but I will try to incrementally build AI configurations alongside the project rather than trying to engineer a perfect prompt environment all at once.
