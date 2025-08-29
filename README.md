![madness](banner.svg)

# madness

## 개요

채팅 웹 어플리케이션 **Madness** 프론트엔드

## 주요 기능

- **실시간 채팅 인터페이스**
  - WebSocket(STOMP, SockJS)
  - 채팅방 목록 조회 및 입장, 메시지 송수신
- **채팅방 UI**
  - Shadcn/components 기반의 채팅 메시지 리스트, 입력 폼
  - 채팅방 입장 시 최신 메시지 로딩 및 스크롤 관리
- **프로필 및 설정 페이지**
  - Avatar 컴포넌트를 통한 사용자 프로필 이미지 표시 및 변경
  - 사용자 정보 조회/수정
- **반응형 레이아웃**
  - Tailwind CSS를 활용하여 모바일/데스크탑 모두 지원하는 반응형 UI 구현

## 기술 스택

- **Frontend Framework & Language**
  - Next.js 15.2.2
  - React 19.0.0, TypeScript
- **스타일 & UI 컴포넌트**
  - Tailwind CSS 4.x, Tailwind CSS Animate
  - Shadcn/components
- **웹소켓 & 메시징**
  - STOMP, SockJS (백엔드 WebSocket 엔드포인트와 연결)
- **빌드 & 배포**
  - GitHub Actions, GitHub Pages

## 프로젝트 설치 및 실행

```bash
# 1. 레포지토리 클론
git clone https://github.com/nera1/madness.git
cd madness

# 2. 의존성 설치
npm install
# 또는 yarn install

# 3. 개발 서버 실행 (localhost:3000)
npm run dev
# 또는 yarn dev

# 4. 프로덕션 빌드 & 실행
npm run build
npm run start

# 또는 yarn build && yarn start
npm install: package.json에 명시된 모든 의존성을 설치
npm run dev: Next.js 개발 모드로 실행
npm run build: 프로덕션 빌드를 수행
npm run start: 빌드된 정적 파일로 실제 서비스 모드를 실행
npm run lint: ESLint 규칙에 따라 코드 스타일을 검증
```

## 환경 변수

### Local(Development)

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

### Production(not required)

```bash

```

## 도메인

[madn.es](https://madn.es)

## Contact

Email: nera4936@gmail.com
