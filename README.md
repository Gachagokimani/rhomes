# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Docker helper

A small helper script is included to start a container (if present) and safely report its state/health without failing when there is no Health section in the container metadata.

Usage:

```bash
./scripts/docker-health.sh [container-name]
```

Defaults to `redis-external` if no container name is provided.

## Docker Compose

This project uses a modern Compose file format. If you encounter errors when running `docker compose`, make sure your Docker Engine and Compose plugin are up to date.

Update Docker Compose plugin (Linux / Debian/Ubuntu example):

```bash
# Update Docker Engine and CLI
sudo apt update && sudo apt install --only-upgrade docker-ce docker-ce-cli containerd.io

# Install/update the Docker Compose plugin (if you use the plugin)
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p "$DOCKER_CONFIG/cli-plugins"
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"

# Verify
docker compose version
```

If you use Docker Desktop (Mac/Windows) keep it updated via the official UI.
