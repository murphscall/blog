---
title: "신입 개발자가 성능과 안전성을 고려하며 개발하기"
date: "2025-08-13"
tags: ["Java","Spring","Tomcat"]
description : 싱글 스레드와 멀티스레드 환경에서의 안정성과 성능을 어떻게 고려해야할지를 살펴보자.
---


## 1. HashMap vs ConcurrentHashMap

<br>

**HashMap**

- **싱글스레드 환경**에서 사용
- `null` 키/값 허용
- 동기화 안 되어 있음 (멀티스레드 환경에서 문제 생김)
- 일반적인 비즈니스 로직 처리에서 주로 사용

**ConcurrentHashMap**

- **멀티스레드 환경**에서 안전하게 사용
- 예: 캐시, 로그인 세션 관리, 토큰 저장소 등
- 락을 세분화해서 성능도 나쁘지 않음

✅ **그럼 언제 사용하지? 언제 고민해야 하지??**

- 스프링 웹에서 일반적으로 `HashMap` 사용
- 근데, **싱글턴 빈에서 공유 상태 관리**하거나 **멀티스레드에서 동시 접근** 하면 `ConcurrentHashMap` 으로 바꿔야 함


---

## 2. List vs Set

**List**

- 순서 보장됨
- 중복 허용
- 예: 게시글 리스트, 댓글 목록 등 순서 있는 데이터

**Set**

- 순서 보장 안 됨 (일반 `HashSet`)
- 중복 제거됨
- 예: 태그 목록, 중복 없는 사용자 ID 저장 등

🧠 **언제 고민해야 해?**

- 중복 허용 → `List`
- 중복 제거가 중요하거나 포함 여부 빠르게 확인 → `Set`

---

## 3. HashSet vs SortedSet (TreeSet)

<br>

**HashSet**

- 순서 없음
- 내부적으로 `HashMap`을 사용해서 빠름 (삽입, 검색, 삭제 O(1) 근사)

**SortedSet** / **TreeSet**

- 요소가 **자동 정렬됨** (기본은 오름차순)
- 내부적으로 **이진 탐색 트리** 구조
- 검색, 탐색, 범위 조회 등에 좋음 (O(log n))

**언제 고민해야 해?**

- 순서 상관없이 중복만 제거 → `HashSet`
- 정렬 필요하거나 범위 조건 검색 필요 → `TreeSet`

## 정리 요약 테이블

| 비교 대상                            | 특징          | 언제 쓰나                                  |
|----------------------------------|-------------|----------------------------------------|
| `HashMap` vs `ConcurrentHashMap` | 싱글 vs 멀티스레드 | 공유 자원 있다 → `ConcurrentHashMap`         |
| `List` vs `Set`                  | 순서/중복       | 순서+중복 → `List`, 중복 제거 → `Set`          |
| `HashSet` vs `TreeSet`           | 속도 vs 정렬    | 빠르게 검사만 → `HashSet`, 정렬 필요 → `TreeSet` |

<br>

---

<br>

## 근데 어차피 전부 DB에 저장하고 DB가 알아서 하는데 왜 자료구조에 신경을 써야 할까?

<br>

**1. DB 까지 안 가고도 처리할 수 있을 때**

예를 들어:

- 로그인한 사용자들의 세션/토큰을 `ConcurrentHashMap`에 저장한다.
- 자주 조회되는 데이터는 **메모리 캐시** (`Map`이나 `List`)에 저장해둔다.

👉 이러면 DB를 안 거치니까 빠르고 부담도 덜수 있다.

```java

// 로그인된 사용자 목록
ConcurrentHashMap<String, UserSession> loggedInUsers = new ConcurrentHashMap<>();

```
<br>

**2. DB 에서 데이터를 읽은 다음 가공/필터링할 때**

한 번 DB 에서 땡겨온 리스트에서 조건 걸고 필터링해야 할 때

```java

List<User> allUsers = userRepository.findAll();
List<User> admins = allUsers.stream()
                            .filter(u -> u.getRole().equals("ADMIN"))
                            .toList();

```

👉 이때 리스트, 맵, 셋이 어떻게 구성돼 있냐에 따라 속도 차이 남

<br>

**3. 한 요청 안에서 임시 데이터 저장할 때**

웹 요청 처리 중 계산된 결과, 중복 검사, 조건 분기 등을 위해 메모리 자료구조 씀


```java

Set<String> processedEmails = new HashSet<>();
for (User user : users) {
    if (!processedEmails.contains(user.getEmail())) {
        processedEmails.add(user.getEmail());
        // 처리 진행
    }
}

```

👉 `Set` 안 쓰고 `List` 썼으면 contains 성능 떨어져서 느림

**4. 캐시 / 랭킹 / 실시간 피드 같은 시스템 만들 때**

- `Map`으로 캐시 저장 (`LRU`, `LFU` 등 구현)
- `TreeSet`으로 랭킹 정렬 유지
- `Queue`나 `Deque`로 알림 목록 유지

이건 DB 보다 훨씬 자주 접근되는 영역이라 자료구조가 핵심이다.

<br>

**즉, DB는 ‘저장소’고, 자바 컬렉션은 ‘처리 도구’**


그래서 필요한 데이터만 뽑아서, 자바 메모리에서 빠르게 처리하는 게 핵심이다.


## 진짜 실무 꿀팁

- 무조건 <u>DB 에서 처리할 수 있으면 SQL 로 처리하는 게 좋다.</u> (속도도 빠름)
- 하지만 <u>DB 에서 다 못하는 작업 (복잡한 조건 분기, 조합, 캐시)은 메모리에서 처리해야 함</u>
- 그때 자료구조 잘 쓰면 성능 차이가 **수십 배** 차이 나기도 한다.

## 근데 이럴거면 그냥 REDIS 쓰면 되는 것이 아닐까?

결론부터 말하자면

✅ **맞기도 하고,** ❌ **항상 맞는 건 아니다.**

**Redis 가 해결해주는 영역**과 **자바 메모리에서 직접 처리해야 하는 영역**이 다르다.

---

## Redis 가 좋을 때

<br>

**1. 여러 서버가 공유해야 하는 데이터**

- 로그인한 사용자 세션, 토큰
- 접속자 수, 실시간 알림, 랭킹
- 웹소켓 상태 관리

➡ 자바 객체는 JVM 한 곳에만 있고, **서버끼리 공유 안 되니까**

➡ Redis 에 올려야 **모든 서버가 같은 데이터**를 볼 수 있음

---

**2. 자주 읽고 쓰는 캐시 (DB 보다 빠름)**

- 게시글 조회 수, 실시간 인기글
- 자주 조회되는 코드 테이블
- 장바구니, 임시 저장, OTP 등

➡ DB에 가면 느린데, Redis는 **메모리 기반이라 겁나 빠름**

---

## ❌ Redis 안 쓰는 게 더 나은 경우

<br>

**1. 요청 한 번 안에서만 쓰는 임시 데이터**


```java

@PostMapping("/submit")
public void submitData(@RequestBody FormData data) {
    Set<String> duplicates = new HashSet<>();
    for (String email : data.getEmails()) {
        if (duplicates.contains(email)) {
            throw new Error("중복된 이메일");
        }
        duplicates.add(email);
    }
}

```

 이런 건 그냥 JVM 안에서 컬렉션 쓰는 게 훨씬 빠르고 간편하다.

---

**2. 굳이 Redis 까지 쓸 필요 없는 소규모 데이터**

- 값 10개, 리스트 5개 이런 것
- 다른 데서 접근 안 하고 한 곳에서만 쓸 때

➡ Redis는 네트워크 I/O 타야 하니까 오히려 **과할 수 있음**

---

<br>

## 💡 Redis vs 자바 컬렉션 정리

| 상황              | 자바 컬렉션   | Redis     |
|-----------------|----------|-----------|
| 임시 처리용 (한 요청 안) | ✅ 좋음     | ❌ 과함      |
| 여러 서버가 공유       | ❌ 불가능    | ✅ 필수      |
| 고빈도 캐시 (조회수 등)  | ❌ 부적합    | ✅ 최적      |
| 중복 체크, 정렬, 필터링  | ✅ 가볍고 빠름 | 🔄 가능하긴 함 |
| 서버 꺼지면 안 되는 데이터 | ❌ 사라짐    | ✅ 유지 가능   |

---

<br>

## 🔧 그래서 어떻게 결정하냐?

- **단순하고 한 번만 쓰는 데이터** → 자바 컬렉션으로 처리
- **공유/캐시/반복적인 접근** → Redis
- 둘 다 필요하면 **처리는 메모리**, **공유는 Redis** 조합도 OK

<br>

## 병목 지점은 성능에 안좋은 영향을 줄 가능성이 있다.

※ 락을 통해 mutual exclusion 을 보장해야하는 상황

![image.png](attachment:a3d3828c-9fff-4ee2-81bb-4dc266ee78b6:image.png)

## 왜 병목이 될까?

**1. 한 스레드만 들어갈 수 있음**

- 여러 스레드가 기다리면서 줄 서 있음
- 동시성이 떨어져서 속도 저하

**2. 블록 안의 작업이 오래 걸리면?**

- 다른 스레드들이 기다리는 시간도 길어짐
- 전체 처리량 저하 = 병목 현상

<br>

## 그래서 어떻게 해결할까?

| 방법                       | 설명                                             |
|--------------------------|------------------------------------------------|
| **크리티컬 섹션 최소화**          | `synchronized` 블록을 짧게 유지                       |
| **Concurrent 자료구조 사용**   | 예: `ConcurrentHashMap`, `CopyOnWriteArrayList` |
| **락 분할 (lock striping)** | 큰 락 하나 대신 여러 개로 나누기                            |
| **비동기 큐 처리**             | 스레드풀이나 큐로 요청만 받고, 백그라운드 처리                     |

<br>

## 핵심 정리

- 크리티컬 섹션은 **안정성을 위해 필요한 잠금 영역**
- 하지만 **병목이 될 수 있어서**, 꼭 최소화하고 대안을 고려해야 함
- 실무에서는 동기화보다 **락 안 걸고 처리하는 구조**가 더 선호됨 (동시성 성능 향상)

## 락 안 걸고 처리하는 구조

**1. Concurrent 자료구조 사용**

JDK 에서 제공하는 **스레드 안전한 컬렉션들** 써서 락 안 쓰고도 동시성 처리 가능

| 자료구조                    | 설명                                 |
|-------------------------|------------------------------------|
| `ConcurrentHashMap`     | 멀티스레드-safe 한 Map (내부적으로 세분화된 락 사용) |
| `CopyOnWriteArrayList`  | 읽기 위주일 때 좋은 List (쓰기 시 복사)         |
| `ConcurrentLinkedQueue` | 락 없이 동작하는 큐 (CAS 기반)               |

**<u>내부적으로 정교하게 락 분할/비차단 알고리즘이 들어가 있음</u>**
**직접 `synchronized` 안 걸어도 됨**


---

**2. 원자적 연산 (Atomic) 사용**

동시 접근이 필요한 숫자나 boolean 등을 다룰 땐 `AtomicInteger`, `AtomicBoolean` 같은 거 써

```java

AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();  // 락 없이 원자적으로 증가

```

➡ 락 없이도 **데이터 경쟁 없이** 안전하게 증가/감소

---

**3. 이벤트 큐 기반 처리 (Producer - Consumer 패턴)**

"여러 요청 → 큐에 쌓기 → 백그라운드 스레드가 하나씩 처리"


이 구조는 요청 자체는 병렬로 받아도 **처리는 하나의 스레드가 하니까 동기화 안 걸어도 된다.**

```java
BlockingQueue<Event> queue = new LinkedBlockingQueue<>();

// Producer
queue.add(new Event(...));

// Consumer
while (true) {
    Event e = queue.take();
    process(e);  // 동기화 필요 없음
}

```

➡ 실시간 알림, 채팅, 로그 처리 등에 많이 씀

---

**4. 비동기 처리 / Future / CompletableFuture**

- 결과가 나중에 오더라도, 지금은 응답하고 나중에 백그라운드에서 처리
- **락 없이도 안전**하고 성능 좋음

```java

CompletableFuture.runAsync(() -> {
    // 여기서 처리하는 건 다른 스레드니까 동기화 필요 없음
    updateViewCount();
});

```

➡ 웹 요청 처리 속도 개선할 때 유용함

---

## 🧠 락 vs 락 없는 구조 요약

| 방식                             | 특징            | 사용 예시           |
|--------------------------------|---------------|-----------------|
| `synchronized`, `Lock`         | 단순, 안전하지만 느림  | 짧은 코드 블록, 초기 구현 |
| `ConcurrentHashMap`, `Atomic*` | 성능 좋고 안전      | 실시간 통계, 캐시      |
| 이벤트 큐                          | 병렬 수신 + 순차 처리 | 로그, 알림          |
| `CompletableFuture`            | 비동기 + 병렬 처리   | 비필수 작업, 백업처리    |

---

## 실무에서 진짜 자주 쓰는 패턴

```java
// 1. 데이터는 ConcurrentHashMap에 캐싱해두고
ConcurrentHashMap<String, Integer> viewCounts = new ConcurrentHashMap<>();

// 2. 요청 받을 땐 그냥 카운트만 증가
viewCounts.merge(postId, 1, Integer::sum);

// 3. 일정 시간마다 DB에 flush (배치 처리)

```

➡ 실시간 처리는 빠르고, DB 반영은 나중에 천천히

➡ 락 없음 + 성능 좋음 + 안정성 OK

<br>

병목 지점은 성능에 안좋은 영향을 줄 가능성이 있다

## DBCP Connection pool 의 max 와 min 값을 다르게 준 상황 ( min : 2 , max : 6)

- db connection pool 은 보통 min 값과 max 값을 줄 수 있다 ( 히카리 cp는 좀 다름 )
- 평상시 2개를 유지하다가 요청이 늘어나면 늘어나는 식
- 트래픽이 급격하게 늘어나면 6개 까지 늘어남 ⇒ 약간의 딜레이가 생김
- 그런데도 계속 트래픽이 쏠리면 톰캣 스레드 풀까지 급격하게 다차면서 또 병목이 생김
- 그래서 애초에 6개로 잡으면 6개로 감당할 수 있는 트래픽 급증가는 감당할 수가 있으니.. 고민해봐야 할 문제