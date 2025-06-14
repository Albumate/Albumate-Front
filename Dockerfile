FROM python:3.10-slim

WORKDIR /app

# 1) 종속성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) 소스 복사
COPY . .

# 3) 컨테이너 내부 6000 포트 열기
EXPOSE 8000

# 4) Flask 실행
#    (FLASK_APP 환경변수는 compose 에서 설정)
CMD ["flask", "run", "--host=0.0.0.0", "--port=8000"]
