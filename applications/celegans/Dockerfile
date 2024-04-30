FROM node:21.7 as frontend

ENV APP_DIR=/app

WORKDIR ${APP_DIR}
COPY frontend/package.json ${APP_DIR}
COPY frontend/yarn.lock ${APP_DIR}
RUN yarn install --frozen-lockfile

COPY frontend ${APP_DIR}
RUN npm run build

#####

ARG NO_SOURCEMAP
FROM python:3.11

ENV MODULE_NAME=backend
ENV PORT=8080
ENV WORKERS=2
ENV APP_DIR=/usr/src/app
ENV NO_SOURCEMAP=${NO_SOURCEMAP}
ENV PRODUCTION=true

WORKDIR ${APP_DIR}
RUN mkdir -p ${APP_DIR}/static/www

COPY backend/requirements.txt ${APP_DIR}
RUN --mount=type=cache,target=/root/.cache python -m pip install --upgrade pip &&\
    pip3 install --no-cache-dir -r requirements.txt --prefer-binary

COPY backend/requirements.txt backend/setup.py ${APP_DIR}
RUN python3 -m pip install -e .

COPY backend ${APP_DIR}
RUN python3 manage.py collectstatic --noinput

COPY --from=frontend /app/dist ${APP_DIR}/static/www

ENTRYPOINT uvicorn --workers ${WORKERS} --host 0.0.0.0 --port ${PORT} visualizer.asgi:application