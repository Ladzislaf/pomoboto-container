FROM node:lts
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# ENV DATABASE_URL=postgres://postgres.kbrspbhcunrdeqggewpo:srFCo4leuqiqygQQ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?schema=_pomoboto&pgbouncer=true
# ENV DIRECT_URL=postgres://postgres.kbrspbhcunrdeqggewpo:srFCo4leuqiqygQQ@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=_pomoboto
RUN npx prisma generate
# ENV BOT_TOKEN=your-bot-token
# ENV WEBHOOK_DOMAIN=your-conatainer-domain
# REDIS_URL=your-redis-url
ENV WEBHOOK_PORT=443
EXPOSE 443
CMD [ "node", "index.js" ]
