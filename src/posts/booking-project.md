---
title: "콘서트 예약 시스템 개발"
date: "2025-09-16"
tags: ["Redis" , "프로젝트 고민", "Database"]
description: "동시성 제어 기술에 대한 고민, 트랜잭션의 범위와 불필요한 리소스 낭비"
---

## 서론

혼자 진행할 프로젝트를 고민하면서 여러 좋은 아이디어들과 기획이 떠올랐었다.
사실 당장 만들고 싶다는 생각은 많았는데 곰곰히 생각해보니 지금 나에게 필요한건 그게 아닌 것 같았다. 

지금까지 진행했던 프로젝트들을 되돌아봤을 때 생각해보면 '단순히 기능들을 나열한 것 뿐 아닐까?' 라는 생각을 했다.
그래서 실제로 정말 어려운 요구사항을 가정하고 스스로 한계라고 느껴질만한 부분까지 깊이 있게 파내려가서 해결하는 경험을 쌓고 싶었다.
또한, 그게 비전공자인 나에게 다른 경쟁자가 쫓아오지 못하게 하는 기술적인 해자가 될 수 있다고 생각한다.

그렇게 정한 프로젝트는 **콘서트 예매 시스템**인데 해당 주제에 프로젝트를 선택한 이유는 
콘서트 예매 특성상 **짧은 시간 안에 동시에 많은 요청이 몰리는 구조**이고 해당 트래픽들을 어떻게 처리할 것인지, 또 어떻게 해야 데이터 정합성을 잘 유지 할 수 있을지 고민을 하고 좋은 경험들을 쌓을 수 있을 것 같았다.



## 동시성 제어 기술에 대한 고민

콘서트 예매 시스템 특성상 하나의 티켓(좌석)을 예매하기 위해 많은 요청들이 동시에 쏟아질 것이다.
하나의 티켓은 하나의 회원에게만 할당되어야하고 두명이 같은 하나의 티켓을 가질 수는 없다.
이러한 데이터 정합성을 위해서 어떤 동시성 제어 기술을 써야할까 고민이 되었다. 알아본 기술들은 아래와 같았다.

### 낙관적 락
- 충돌이 거의 발생하지 않는다고 낙관적으로 가정하는 락.
- DB 가 제공하는 락 기능이 아니라 어플리케이션에서 제공하는 버전 관리 기능을 사용한다.
- version 등의 구분 컬럼으로 충돌을 예방한다.
- 트랜잭션을 커밋하는 시점에 충돌을 알 수 있다.
- 최종 업데이트 과정에서만 락을 점유하기 때문에 락 점유 시간을 최소화하여 동시성을 높일 수 있다.


### 비관적 락
- 충돌이 발생한다고 비관적으로 가정하는 방식
- Repeatable Read, Serializableable 정도의 격리성에서 가능하다.
- 트랜잭션이 시작될 때 S Lock 또는 X Lock을 걸고 시작한다.
- DB 가 제공하는 락을 사용한다.
- 데이터 수정 즉시 트랜잭션 충돌을 알 수 있다.
- 교착 상태 문제가 자주 발생할 수 있다.

### 분산 락

- 서버가 여러 대인 상황에서 동일한 데이터에 대한 동기화를 보장하기 위해 사용한다.
- 서버들 간 동기화된 처리가 필요하고, 여러 서버에 공통된 락을 적용해야 하기 때문에 redis 를 이용하여 분산락을 이용한다.
- 분산락 같은 경우 공통된 데이터 저장소를 이용해 자원이 사용중인지 확인하기 때문에 전체 서버에 동기화된 처리가 가능하다.


처음에는 비교적 구현이 간단한 비관 락을 사용했다.
현재 상황만 놓고 보면 비관 락이 문제가 될 부분이 보이지 않았기 때문이었다. 하지만 프로젝트 목표처럼 만약 추후에 서비스가 확장이 되고
정말 많은 사용자가 몰린다면 비관적 락은 성능 저하에 대한 문제가 발생할 여지가 있었다.

그래서 결론적으로 선택한 기술은 **분산락과 Unique 제약조건을 함께 사용하게 되었다.**

일단 아래와 같은 코드로 분산락을 구현했다.

```java 

@Transactional
public Long createBooking(final Long userId, final BookingRequest bookingRequest) {

		final Long ticketId = bookingRequest.ticketId();
		final String lockKey = "ticket:" + ticketId;
		final RLock lock = redissonClient.getLock(lockKey);

		try {
			boolean isLocked = lock.tryLock(0, 3, TimeUnit.SECONDS);
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
			throw new RuntimeException(e);
		} finally {
			if (lock.isLocked() && lock.isHeldByCurrentThread()) {

				lock.unlock();
			}
		}
	}

```

근데 해당 코드에 심각한 문제가 몇 개 있었다.

하나는 락을 해제 하는 타이밍과 트랜잭션의 범위가 불일치 한다는 것이였고 또 다른 문제는 락을 기다리고 있던 다른 요청들이 어차피 예매가 완료되어  실패할 요청인데도 불구하고 DB를 조회한다는 것 이었다.
해당 문제를 해결하기 위해 일단 락 획득과 트랜잭션 코드를 분리했다.


```java 
public Long createBooking(final Long userId, final BookingRequest bookingRequest) {

		log.info("예매 요청 시작");

		final Long ticketId = bookingRequest.ticketId();
		final String lockKey = "ticket:" + ticketId;
		final RLock lock = redissonClient.getLock(lockKey);
		final String cacheKey = TICKET_CACHE_PREFIX + ticketId;

		log.info("캐시 확인");

		String status = redisTemplate.opsForValue().get(cacheKey);

		if ("BOOKED".equals(status)) {
			log.warn("이미 예약된 티켓입니다.");
			throw new IllegalStateException("이미 예약된 티켓");
		}

		try {
			log.info("락 획득 시작");
			boolean isLocked = lock.tryLock(0, 3, TimeUnit.SECONDS);
			if (!isLocked) {
				log.warn("락 획득 불가");
				throw new IllegalStateException("락 획득 불가");
			}
			log.info("락 획득 성공");
			return bookingTransactionalService.createBookingTx(userId, ticketId, cacheKey, lock);

		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
	}

```

스프링에서는 같은 클래스 내에 메소드를 호출하게 되면 트랜잭션이 적용되지 않는다고 한다.
그래서 새로운 클래스를 만들고 분리된 로직을 위해 메소드를 만들었다. 추후에는 AOP 에 대해서 학습하고 락 획득만 담당하게 만든다면 어떨까 싶다. 꼭 다시 적용해볼 생각이다.

```java 

@Service
public class BookingTransactionalService {

	private static final Logger log = LoggerFactory.getLogger(BookingTransactionalService.class);
	private UserRepository userRepository;
	private TicketRepository ticketRepository;
	private BookingRepository bookingRepository;
	private StringRedisTemplate redisTemplate;

	public BookingTransactionalService(UserRepository userRepository, TicketRepository ticketRepository,
		BookingRepository bookingRepository, StringRedisTemplate redisTemplate) {
		this.userRepository = userRepository;
		this.ticketRepository = ticketRepository;
		this.bookingRepository = bookingRepository;
		this.redisTemplate = redisTemplate;
	}

	@Transactional
	protected Long createBookingTx(final Long userId, final Long ticketId, final String cacheKey, final RLock lock) {

		log.info("락 획득후 예매시작");

		User user = userRepository.findByIdOrThrow(userId);
		Ticket ticket = ticketRepository.findByIdWithConcertOrThrow(ticketId);

		// DB 유니크/상태 체크
		ticket.checkOrUpdate();

		Booking booking = new Booking(user, ticket);
		Booking saveBooking = bookingRepository.save(booking);

		log.info("락 획득후 예매 완료");

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				try {
					redisTemplate.opsForValue().set(cacheKey, "BOOKED", 3, TimeUnit.HOURS);
				} finally {
					if (lock.isHeldByCurrentThread()) {
						lock.unlock();
					}
				}
			}

			@Override
			public void afterCompletion(int status) {
				if (status == TransactionSynchronization.STATUS_ROLLED_BACK) {
					if (lock.isHeldByCurrentThread()) {
						lock.unlock();
					}
				}

			}
		});

		return saveBooking.getId();
	}
}

```

맨 처음 코드에서는 락 해제를 finally 블록에서 해제를 하게 해두었는데 finally 는 그냥 메서드 실행이 끝날 때 실행되는 것이기 때문에 트랜잭션이 아직 커밋되지 않은 상태인데도 불구하고 락을 해제 할 수도 있다.
그러면 그 사이에 다른 스레드가 같은 좌석의 락을 뺏어갈 수 있으니 완전한 커밋 이후 해제가 보장되게 하기 위해서 `TransactionSynchronizationManager` 을 사용했다.

DB 작업이 끝나고 커밋 시점이 되었을 때, 스프링은 `TransactionSynchronizationManager` 에 등록된 모든 `TransactionSynchronization` 을 순서대로 실행한다.
그래서 `lock.unlock` 을 여기에 등록해두면, db  커밋이 완료된 직후에 락이 풀리게 된다. 즉 , 트랜잭션이 확정된 이후 안전한 시점에 락 해제가 보장된다.


그리고 아직 한가지 문제가 남았는데 락을 기다리는 나머지 요청들이 락을 얻고 다시 DB 에서 티켓 상태를 조회한다는 것이다.
이 문제는 트랜잭션이 완료 되고 커밋 후에 레디스에 해당 티켓의 상태를 ttl 로 일정 시간 동안 저장해두는 방식으로 해결했다.

```java 
String status = redisTemplate.opsForValue().get(cacheKey);

// 락 획득 전
```

다만, db의 데이터와 캐시의 동일성을 위해서는 예매 취소 시에는 꼭 캐시를 지워야한다.


---

### 회고

해당 문제를 해결하면서 트랜잭션에 대해서 좀 더 깊게 학습이 필요하다는 생각이 들었다.
단순히 트랜잭션은 하나라도 실패 시에 롤백 , 아니면 모두 성공과 같은 가벼운 개념으로 알고 있었는데 트랜잭션의 범위에 대해서 또 트랜잭션을 적용할 때 효율성에 대해서 생각해봐야겠다.
그리고 지금은 새로운 클래스를 만들어 락 획득과 트랜잭션 코드를 분리했지만 락 획득을 하는 코드를 AOP 적용하여 옮겨보려고 한다.


---

## AOP 적용 후기 (2025-10-25)

기존의 코드는 `BookingTransactionService`를 만들어 트랜잭션 코드와 락획득 코드를 분리했었다.
근데 비즈니스 로직과 락획득 코드를 분리하고 싶었고 다른 도메인에서도 락획득 및 해제가 필요할 순간이 온다면
매번 분리해주어야 하는 상황이 발생할 것이라고 생각했다. 그래서 AOP 를 적용하면 락 관련 코드들을 한곳에서만 관리하고 언제든지 다른 곳에도 사용 가능하다고 생각하여 AOP 를 적용하게 되었다.


먼저 락 획득이 필요한 메소드를 AOP 가 구별할 수 있도록 어노테이션을 만들고 선언했다.

```java 
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DistributedLock {
	// 락을 걸 자원을 식별할 키
	String key();
    // 락을 얻기 위해 최대 얼마까지 기다릴지 시간 설정
	long waitTime() default 0;
    //락을 획득한 후 자동으로 해제될 때까지의 유효시간
	long leaseTime() default 3;
    // 위의 시간 단위 설정
	TimeUnit timeUnit() default TimeUnit.SECONDS;
}


```
아래와 같이 만든 어노테이션은 락 획득이 필요한 메서드 위에 `@DistributedLock` 을 선언하여 적용할 수 있다.



```java 
@DistributedLock(
		key = "'ticket:' + #bookingRequest.ticketId()",
		waitTime = 0,
		leaseTime = 10,
		timeUnit = TimeUnit.SECONDS
	)
	public Long createBooking(final Long userId, final BookingRequest bookingRequest) {

		User user = userRepository.findByIdOrThrow(userId);
		Ticket ticket = ticketRepository.findByIdWithConcertOrThrow(bookingRequest.ticketId());

		// DB 유니크/상태 체크
		ticket.checkOrUpdate();

		Booking booking = new Booking(user, ticket);
		Booking saveBooking = bookingRepository.save(booking);

		return saveBooking.getId();
	}
```


어노테이션을 만들고 락을 적용할 메서드 위에 선언했다면 이제는 그 어노테이션이 선언된 곳에 적용될 코드를 작성해야한다.

아래와 같은 클래스를 만들고 `@Aspect` 어노테이션을 선언했다.

```java 


@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class DistributedLockAspect {

	private final RedissonClient redissonClient;
	private final AopForTransaction aopForTransaction;
	private final ExpressionParser parser = new SpelExpressionParser();
	private final ParameterNameDiscoverer nameDiscoverer = new DefaultParameterNameDiscoverer();

	@Around("@annotation(distributedLock)")
	public Object lock(final ProceedingJoinPoint joinPoint, DistributedLock distributedLock) throws Throwable {

		// 현재 실행 중인 메소드를 리플렉션(Reflection)으로 가져온다.
		Method method = ((MethodSignature)joinPoint.getSignature()).getMethod();

		// 메소드 매개변수 이름 / 값 추출
		String[] paramNames = nameDiscoverer.getParameterNames(method);
		Object[] args = joinPoint.getArgs();

        // 변수 이름을 실제 값으로 바인딩 한다.
		StandardEvaluationContext context = new StandardEvaluationContext();
		for (int i = 0; i < paramNames.length; i++) {
			context.setVariable(paramNames[i], args[i]);
		}

		String key = parser.parseExpression(distributedLock.key()).getValue(context, String.class);
		RLock lock = redissonClient.getLock(key);

		try {
			boolean isLocked = lock.tryLock(distributedLock.waitTime(), distributedLock.leaseTime(),
				distributedLock.timeUnit());
			if (!isLocked) {
				throw new InterruptedException("락을 획득 할 수 없습니다.");
			}

			log.info("락 획득 성공 : {}", key);
			return aopForTransaction.proceed(joinPoint);
		} catch (InterruptedException e) {
			throw new InterruptedException();
		} finally {
			try {
				lock.unlock();
				log.info("[LOCK] 락 해제 완료: {}", key);
			} catch (IllegalMonitorStateException e) {
				log.info("[LOCK] 이미 해제된 락: {}", key);
			}
		}
	}
}
```

먼저 이전에 어노테이션을 선언한 `createBooking` 메소드의 `@DistributedLock` 을 다시 한번 봐보자.

```java 

@DistributedLock(
		key = "'ticket:' + #bookingRequest.ticketId()",
		waitTime = 0,
		leaseTime = 10,
		timeUnit = TimeUnit.SECONDS
	)
```

key 부분을 보면 `#bookingRequest.ticketId()` 가 있는데 이는 SpEL (스프링 표현식) 문법이다.
코드에서 문자열로 쓴 표현('ticket:' + #bookingRequest.ticketId())을 실제 객체의 값으로 평가할 수 있게 해주는 기능이라고 생각하면 된다.
이는 실제 런타임 시 실제 파라미터의 `bookingRequest.ticketId()` 값으로 바뀌게된다.
간단히 예를 들자면 그냥 `ticketId:1` 처럼 바뀌는 것이다.

`ExpressionParser parser = new SpelExpressionParser();` 는  문자열 형태로 적힌 `"‘ticket:’ + #bookingRequest.ticketId()"`를
Expression 객체로 변환한다.
이후 getValue(context) 메서드를 통해 실제 값을 계산할 수 있게 해준다.

`StandardEvaluationContext context = new StandardEvaluationContext();`는
SpEL이 표현식을 해석할 때 사용할 변수 환경(context) 을 설정한다. 여기서 사용할 변수 환경이란 것이 조금 의문이 들었는데,
SpEL은 “#bookingRequest”가 뭔 객체인지, ticketId()가 뭘 의미하는지 알 수 없다고 한다. 그래서 SpEL 이 어디서 어떤 변수를 찾아야 하는지 알려주는게 필요하다.
그리고 그걸 바로 `EvaluationContext` (평가 컨텍스트) 라고 한다.

쉽게 말해서, 변수 사전을 만들어주고 "bookingRequest" 가 뭔지 모른다면, context 안에서 찾아봐" 라는 말이다.

`parser.parseExpression(...).getValue(context, String.class);` 는
parser 가 문자열을 표현식으로 바꾸고 context 를 통해 실제 값으로 평가하는 것이다.

```java 
String key = parser.parseExpression(distributedLock.key())
                   .getValue(context, String.class);
```
이 줄이 실행되면   

- `distributedLock.key() = "‘ticket:’ + #bookingRequest.ticketId()"`
- `context = bookingRequest.ticketId() == 5`

즉, `ticket:5` 와 같이 표현된다.

---

위와 같이 SpEL 표현식을 파싱하는 과정들을 거치고 이제 락 획득을 시도한다.
실패한다면 에러를 던지고, 성공했다면 `aopForTransaction.proceed(joinPoint);` 이 실행될 것이다.

`aopForTransaction.proceed(joinPoint)` 는 그냥 락 획득 후 실행하려고 했던 `createBooking` 메소드를 실행하는 것이다.
하지만, 조금의 추가된 설정들이 있으니 한번 알아보자.

아래의 코드를 보자.

```java 

@Component
@Slf4j
public class AopForTransaction {

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public Object proceed(final ProceedingJoinPoint joinPoint) throws Throwable {
		Object result = joinPoint.proceed();

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				log.info("[TX] 트랜잭션 커밋 완료");
			}

			@Override
			public void afterCompletion(int status) {
				if (status == STATUS_COMMITTED) {
					log.info("[TX] afterCompletion: 커밋 완료 상태");
				} else if (status == STATUS_ROLLED_BACK) {
					log.info("[TX] afterCompletion: 롤백됨");
				}
			}
		});

		return result;
	}
}
```
`Propagation.REQUIRES_NEW`는 새 트랜잭션을 “강제로” 시작하는 설정이다.
기존 `BookingService.createBooking()`에는 트랜잭션이 없으므로, 만약 REQUIRES_NEW가 빠지면 그냥 단순히 DB save()를 호출할 뿐이고,
커밋, 롤백, afterCommit 같은 트랜잭션 이벤트는 전혀 발생하지 않게 된다.

여기서는 `REQUIRES_NEW` 덕분에 락이 걸린 구간 안에서 “트랜잭션이 명확히 분리된 상태로” DB 작업이 일어나게 된다. 

---

## 회고

위와 같이 분산락을 적용하고 AOP 를 통해 코드를 분리했다. 이론대로 구현해보긴 했지만
아직 머릿 속에서 명확히 정리된 느낌은 아니다. 또 내가 놓치고 있는 부분은 없을까? 라는 걱정이 들기도한다.

하지만 그래도 조금 성장한 것 같은 기분이 든다. 예전 같았으면 대충 듣고 넘어갔을 "트랜잭션" 이라는 개념을 하루, 이틀 넘게 정말 명확하게 이해하기 위해서 
자료를 찾고 트랜잭션의 범위, 최소화 등 깊게 이해하려고 노력했다. 
