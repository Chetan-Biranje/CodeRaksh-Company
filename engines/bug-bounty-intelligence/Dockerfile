# syntax=docker/dockerfile:1
FROM python:3.12-slim@sha256:191083cdf6c7bda8c76158983163ead5d5cf7b77cf3033e805bb0f5296f51b4b AS build
WORKDIR /src
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir --prefix=/install .

FROM python:3.12-slim@sha256:191083cdf6c7bda8c76158983163ead5d5cf7b77cf3033e805bb0f5296f51b4b
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    CODERAKSH_DATA_DIR=/data CODERAKSH_PROGRAMS_DIR=/programs CODERAKSH_MODE=mock
RUN useradd --system --uid 10001 --home-dir /nonexistent --shell /usr/sbin/nologin coderaksh \
    && mkdir /data /programs && chown coderaksh /data
COPY --from=build /install /usr/local
USER 10001
VOLUME ["/data", "/programs"]
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/health', timeout=2)"
# Secrets (TAPLINE_API_KEY, CODERAKSH_API_TOKEN, ...) are passed at runtime, never baked in.
ENTRYPOINT ["coderaksh"]
CMD ["serve", "--host", "0.0.0.0", "--port", "8000"]
