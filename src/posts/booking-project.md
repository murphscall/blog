---
title: "콘서트 예약 시스템 개발"
date: "2025-09-16"
tags: ["Redis" , "프로젝트 고민", "Database"]
description: "분산 락을 사용할 때와 비관적 락을 사용해야 할 때"
---

## 서론

혼자 진행할 프로젝트를 고민하면서 여러 좋은 아이디어들과 기획이 떠올랐었다.
사실 당장 만들고 싶다는 생각은 많았는데 곰곰히 생각해보니 지금 나에게 필요한건 그게 아닌 것 같았다. 

지금까지 진행했던 프로젝트들을 되돌아봤을 때 생각해보면 '단순히 기능들을 나열한 것 뿐 아닐까?' 라는 생각을 했다.
그래서 실제로 정말 어려운 요구사항을 가정하고 스스로 한계라고 느껴질만한 부분까지 깊이 있게 파내려가서 해결하는 경험을 쌓고 싶었다.
또한, 그게 비전공자인 나에게 다른 경쟁자가 쫓아오지 못하게 하는 기술적인 해자가 될 수 있다고 생각한다.



## 분산락과 비관락에 대한 고민

개발을 진행하면서 분산 환경에서의 비관락은 성능 저하 또는 데드락 현상을 발생시킬 수 있다는 내용을 보았다.
그래서 문득 분산락이 비관락보다 성능이 뛰어난 것은 아니지만 <u>분산환경에서 비관락의 성능저하가 있을 때 둘의 차이가 어느정도 인지 눈으로 확인하고 싶었다.</u>

현재 프로젝트는 비관 락 + unique 제약 조건을 통해 데이터 정합성을 유지하고 있는데, 분산 락과의 비교를 위해 코드를 추가하고 테스트 도구를 도입했다.

```javascript
import http from 'k6/http';  
import {check, sleep} from 'k6';  
import exec from 'k6/execution';  
  
export function setup() {  
    const loginRes = http.post('http://localhost:8080/api/auth/login', JSON.stringify({  
        email: 'test@naver.com', // 실제 로그인 가능한 계정  
        password: 'test1111^^',      // 실제 비밀번호  
    }), {  
        headers: {'Content-Type': 'application/json'},  
    });  
    if (loginRes.status !== 200) {  
        exec.test.abort('Login failed, aborting test.');  
    }  
    const accessToken = loginRes.cookies.accessToken[0].value;  
    return accessToken;  
}  
  
export const options = {  
    scenarios: {  
        burst_booking: {  
            executor: 'ramping-vus',  
            startVUs: 0,  
            stages: [  
                {duration: '5s', target: 300},  
                {duration: '30s', target: 300},  
                {duration: '10s', target: 0},  
            ],        },    },};  
  
export default function (accessToken) {  
    if (!accessToken) {  
        return;  
    }  
    const port = 8080 + (exec.vu.idInTest % 2);  
    const url = `http://localhost:${port}/api/bookings`;  
  
    const payload = JSON.stringify({  
        ticketId: 1, // DB에 실제로 존재하는 티켓 ID    });  
  
    const params = {  
        headers: {  
            'Content-Type': 'application/json',  
            'Cookie': `accessToken=${accessToken}`,  
        },    
    };
    const bookingRes = http.post(url, payload, params);  
  
    check(bookingRes, {  
        '예매 성공 (201 Created)': (r) => r.status === 201,  
        '예매 실패/경합 (400)': (r) => r.status === 400,  
    });  
    sleep(1);  
}

```


`{duration: '5s', target: 300}`  : 0 명에서 300명으로 5초 동안 점진적으로 증가 시킨다.
`{duration: '30s', target: 300}` : 300명을 유지하고, 30초 동안 부하를 지속한다.
`{duration: '10s', target: 0}` : 300명에서 0명으로 10초 동안 점진적으로 감소 시킨다.

예매 티켓 오픈 시점에는 짧지만 급격하게 증가하는 트래픽이라고 생각해서 위와 같은 옵션으로 테스트를 진행했다.


그리고 아래는 BookingService 의 예매 로직이다.

### 예매 로직

```java 
@Transactional
	public Long createBooking(final Long userId, final BookingRequest bookingRequest) {

		    Long ticketId = bookingRequest.ticketId();

			User user = userRepository.findByIdOrThrow(userId);
			Ticket ticket = ticketRepository.findByIdWithConcertOrThrow(bookingRequest.ticketId());

			// 예메 상태 여부 검사 및 변경
			log.info("[{}] 좌석 상태 확인 및 변경 시도...", requestId);
			ticket.checkOrUpdate();
			log.info("[{}] 좌석 상태 변경 완료.", requestId);

			Booking booking = new Booking(user, ticket);
			Booking saveBooking = bookingRepository.save(booking);

			return saveBooking.getId();
	}
```


### 비관적 락 적용
```java 
@Lock(LockModeType.PESSIMISTIC_WRITE)  
@Query("SELECT t FROM Ticket t JOIN FETCH t.concert c WHERE t.id = :ticketId")  
Optional<Ticket> findByIdWithConcert(@Param("ticketId") Long ticketId);
```

비관적 락을 적용하고 테스트를 진행했다.
```console 
█ TOTAL RESULTS

    checks_total.......................: 22720  496.357955/s
    checks_succeeded...................: 50.00% 11360 out of 22720
    checks_failed......................: 50.00% 11360 out of 22720

    ✗ 예매 성공 (201 Created)
      ↳  0% — ✓ 1 / ✗ 11359
    ✗ 예매 실패/경합 (400)
      ↳  99% — ✓ 11359 / ✗ 1

    HTTP
    http_req_duration.......................................................: avg=3.31ms   min=996µs   med=2.97ms   max=418.34ms p(90)=4ms      p(95)=4.99ms
      { expected_response:true }............................................: avg=108.86ms min=66.06ms med=108.86ms max=151.67ms p(90)=143.11ms p(95)=147.39ms
    http_req_failed.........................................................: 99.98% 11359 out of 11361
    http_reqs...............................................................: 11361  248.200824/s

    EXECUTION
    iteration_duration......................................................: avg=1s       min=1s      med=1s       max=1.41s    p(90)=1s       p(95)=1s
    iterations..............................................................: 11360  248.178977/s
    vus.....................................................................: 15     min=15             max=300
    vus_max.................................................................: 300    min=300            max=300

    NETWORK
    data_received...........................................................: 2.5 MB 54 kB/s
    data_sent...............................................................: 4.2 MB 93 kB/s
```
결과를 들여다보면

`201 created` 는 예매 성공 1명으로 정합성을 잘 지켰고 이미 예약된 티켓을 요청한 나머지는 400 상태코드로 이것도 맞다.

평균 요청 시간 3~4ms 도 나쁘지 않았고, 최대 418ms 정도는 락 때문에 일부 요청이 기다림이 있었던 듯 하다.

일단, "티켓 한장만 성공" 이라는 비즈니스 룰은 잘 지킨 것 같다.


### 분산 락 적용

아래는 분산 락을 적용한 코드이다.

```java 
@Transactional  
public Long createBooking(final Long userId, final BookingRequest bookingRequest) {  
  
    final Long ticketId = bookingRequest.ticketId();  
    final String lockKey = "ticket:" + ticketId;  
    final RLock lock = redissonClient.getLock(lockKey);  
  
    try {  
       boolean isLocked = lock.tryLock(5, 3, TimeUnit.SECONDS);  
  
       if (!isLocked) {  
          throw new IllegalStateException("락 획득 불가");  
       }  
       User user = userRepository.findByIdOrThrow(userId);  
       Ticket ticket = ticketRepository.findByIdWithConcertOrThrow(bookingRequest.ticketId());  
  
       // 예메 상태 여부 검사 및 변경  
       ticket.checkOrUpdate();  
  
       Booking booking = new Booking(user, ticket);  
       Booking saveBooking = bookingRepository.save(booking);  
  
       return saveBooking.getId();  
  
    } catch (InterruptedException e) {  
       Thread.currentThread().interrupt();  
       throw new RuntimeException("락을 획득하는 도중 인터럽트 발생", e);  
    } finally {  
       if (lock.isLocked() && lock.isHeldByCurrentThread()) {  
          lock.unlock();  
       }  
    }  
  
}
```
```consosle 

 █ TOTAL RESULTS

    checks_total.......................: 22698  495.818511/s
    checks_succeeded...................: 49.99% 11348 out of 22698
    checks_failed......................: 50.00% 11350 out of 22698

    ✗ 예매 성공 (201 Created)
      ↳  0% — ✓ 1 / ✗ 11348
    ✗ 예매 실패/경합 (400)
      ↳  99% — ✓ 11347 / ✗ 2

    HTTP
    http_req_duration.......................................................: avg=4.25ms  min=1.51ms  med=3.22ms  max=418.83ms p(90)=5.47ms  p(95)=7ms
      { expected_response:true }............................................: avg=89.34ms min=78.97ms med=89.34ms max=99.71ms  p(90)=97.64ms p(95)=98.68ms
    http_req_failed.........................................................: 99.98% 11348 out of 11350
    http_reqs...............................................................: 11350  247.9311/s

    EXECUTION
    iteration_duration......................................................: avg=1s      min=1s      med=1s      max=1.41s    p(90)=1s      p(95)=1s
    iterations..............................................................: 11349  247.909255/s
    vus.....................................................................: 13     min=13             max=300
    vus_max.................................................................: 300    min=300            max=300

    NETWORK
    data_received...........................................................: 2.5 MB 54 kB/s
    data_sent...............................................................: 4.2 MB 93 kB/s

```

예상했던 결과와는 달리 큰차이가 없고 평균 응답 속도는 오히려 비관적 락이 더 우수했다.
처음에는 왜 성능 저하가 일어나지 않을까 싶어 테스트 부하를 500, 600 명 늘리게 되어도 비슷했다.

