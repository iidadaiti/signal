ARG NODE_TAG="lts-slim"
ARG PACKAGE_MANAGER="pnpm"

FROM node:${NODE_TAG} AS base
ENV PNPM_HOME "/pnpm"
ENV PATH "$PNPM_HOME:$PATH"
RUN corepack enable \
    && corepack enable npm \
    && corepack enable ${PACKAGE_MANAGER}

FROM base AS dev
RUN apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -qq --no-install-recommends \
    git \
    openssh-server \
    tini \
    && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/usr/bin/tini", "--"]
USER node
