# =========================================================================================
# FRONTEND DOCKERFILE: MULTI-STAGE BUILD CHO NEXT.JS 14 (TASK 10 DEVOPS)
# =========================================================================================

# GIAI ĐOẠN 1: BUILDER - Cài đặt gói thư viện và đóng gói ứng dụng Next.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN mkdir -p public

# Biến môi trường truyền vào lúc build phục vụ việc gọi API backend
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build gói ứng dụng Next.js sản phẩm (Standalone bundle)
RUN npm run build

# GIAI ĐOẠN 2: RUNNER - Ảnh chạy chính thức tối ưu kích thước
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Chỉ chép các file thực thi và tài nguyên tĩnh từ Stage 1
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Mở cổng 3000 cho người dùng truy cập web
EXPOSE 3000

# Khởi chạy Next.js Production Server
CMD ["npm", "start"]
