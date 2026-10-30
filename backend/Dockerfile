# =========================================================================================
# BACKEND DOCKERFILE: MULTI-STAGE BUILD CHO NESTJS API (TASK 10 DEVOPS)
# =========================================================================================

# GIAI ĐOẠN 1: BUILDER - Cài đặt thư viện, generate Prisma Client và compile TypeScript sang JavaScript
FROM node:20-alpine AS builder

WORKDIR /app
# Cài đặt thư viện C và OpenSSL cần thiết cho Prisma binary chạy trên môi trường Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# Copy cấu hình package và schema database
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt toàn bộ dependencies
RUN npm install

# Copy toàn bộ mã nguồn backend
COPY . .

# Sinh mã Prisma Client dựa trên schema.prisma và build code sang thư mục /dist
RUN npx prisma generate
RUN npm run build

# GIAI ĐOẠN 2: RUNNER - Ảnh chạy chính thức siêu nhẹ, loại bỏ các file thừa không cần thiết
FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3001

# Copy các file build từ Stage 1 sang Stage 2
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Mở cổng 3001 cho API NestJS
EXPOSE 3001

# Lệnh khởi động container: tự động đồng bộ DB schema, nạp dữ liệu mẫu (seed), rồi chạy server
CMD ["sh", "-c", "npx prisma db push && npx ts-node -T prisma/seed.ts && (node dist/src/main || node dist/main)"]
