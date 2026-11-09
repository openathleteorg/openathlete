# pg_dump matching the hosted PostgreSQL 17, and restic to send the dumps to
# the S3 bucket. The container idles: a Coolify scheduled task runs `backup`.
FROM postgres:17-alpine

RUN apk add --no-cache restic

COPY backup.sh /usr/local/bin/backup
RUN chmod +x /usr/local/bin/backup

ENTRYPOINT []
CMD ["sleep", "infinity"]
