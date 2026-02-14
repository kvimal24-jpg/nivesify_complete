# Nivesify DevContainer

This development container provides a consistent, Linux-based environment for building and deploying your Next.js + Cloudflare Workers project.

## Features
- Node.js 20 (LTS)
- Docker-in-Docker (for local builds)
- GitHub CLI
- Pre-installed VS Code extensions: ESLint, Prettier, Docker, Copilot

## Usage
1. Open this folder in VS Code.
2. When prompted, "Reopen in Container".
3. The container will install dependencies automatically.
4. Use `npm run dev` to start the local dev server.
5. Use `npm run deploy` to deploy to Cloudflare Workers.

## Troubleshooting
- If you see errors related to Docker or permissions, restart the container.
- For Cloudflare deployments, ensure your API credentials are set up in the container.

---

For more info, see [Developing inside a Container](https://code.visualstudio.com/docs/devcontainers/containers).