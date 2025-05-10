# Use the official VS Code “javascript-node” devcontainer image
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:18

# Install the PostgreSQL client
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory where your code will live
WORKDIR /workspace

# Keep the container running
CMD ["sleep", "infinity"]
