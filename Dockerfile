FROM node:24-slim AS ui-v2-build
WORKDIR /build/ui-v2
RUN npm install -g pnpm@11.19.0
COPY ui-v2/package.json ui-v2/pnpm-lock.yaml ui-v2/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY ui-v2/ ./
RUN pnpm build

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
COPY package.json .

RUN pip install --no-cache-dir -r requirements.txt

# We mount /app/app at runtime for dev, but we copy it for prod
COPY ./app ./app
COPY ./static ./static
COPY --from=ui-v2-build /build/static/v2 ./static/v2
COPY CHANGELOG.md .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8434", "--reload"]
