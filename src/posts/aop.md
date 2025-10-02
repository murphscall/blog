---
title : "AOP 의 개념 이해하기"
date: "2025-10-02"
tags: ["AOP"]
description : AOP 를 입문하기 전 개념에 대해서 배워보자.
---

## 서론

프로젝트나 개발을 진행하면서 비즈니스 로직과 관련이 없는 코드나 로깅 코드 들을 써야할 상황이 많았다.
어떻게 이러한 코드들을 분리하고 비즈니스 로직과 완전히 분리할 수 있을까? 
이러한 고민들을 하면서 AOP 라는 개념을 접했다. 사실 예전부터 익숙하게 알고는 있었지만 이번 기회에 좀 제대로 개념을 숙지하고 알아가려고 한다.
AOP 에 대한 학습은 <u>**Tecoble** 이라는 우아한 테크 코스 블로그에서 글을 읽으며 학습해보았다.</u>


## OOP 의 한계

객체지향 프로그래밍은 어플리케이션을 설계할 때 책임과 관심사에 따라 클래스를 분리한다. 클래스가 단일 책임을 가지도록 분리함으로써
각 모듈의 응집도는 높아지고 결합도는 낮아진다. 클래스를 변경하는 이유는 오직 한 가지 이며, 어플리케이션의 한 부분에서 변경이 발생했을 때 그 파급 효과가 시스템의
전체로 퍼져나가는 정도가 낮아진다.

그러나 전통적인 객체지향 설계 방식을 충실히 따르더라도 한 가지 아쉬운 점이 존재한다.
바로 여러 클래스에 로깅이나 보안 및 트랜잭션 등 공통된 기능들은 어쩔 수 없이 흩어져 존재하게 된다는 것이다.
이렇게 어플리케이션 전반에 걸쳐 흩어져있는 공통된 부가 기능을을 **관심사** 라고 한다. 이러한 관심사를 어플리케이션의 핵심 비즈니스 로직 코드로부터 분리하는 방법은 무엇일까?


## Transaction 코드
> UserService.java

```java 
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserDao userDao;
    private final PlatformTransactionManager transactionManager;

    public void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money) {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            //로깅 관련 로직 추가
            //보안 관련 로직 추가
            Account senderAccount = userDao.findAccountById(senderId);
            Account receiverAccount = userDao.findAccountById(receiverId);
            userDao.updateMoney(senderId, senderAccount.withdraw(money));
            userDao.updateMoney(receiverId, receiverAccount.add(money));
            transactionManager.commit(transaction);
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }

    public void withdrawMoney(Long id, Long money) {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            //로깅 관련 로직 추가
            //보안 관련 로직 추가
            Account account = userDao.findAccountById(senderId);
            userDao.updateMoney(senderId, account.withdraw(money));
            transactionManager.commit(transaction);
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }
}

```
> JPA 가 아닌 JDBC 사용 환경을 가정한 코드다. 


출금 및 입금을 처리하는 서비스 로직의 원자성 보장을 위해 내부적으로 트랜잭션을 적용한 코드이다.
문제는 UserService 의 클래스에는 **출금 및 입금**이라는 핵심 비즈니스 로직 이외에도 트랜잭션 경계 설정이라는 부가 기능 관심사가 산재하고 있다.
현재 예제 코드는 부가 기능 관심사가 트랜잭션 하나 뿐이지만, 로깅이나 보안 등의 관심사가 추가되면 어떻게 될까?
`sendMoneyToAnotherUser()` 메서드가 더욱 비대해질 것이다. 또한 트랜잭션과 로깅 및 보안 등의 부가 기능이 필요한 메서드마다 비슷한 코드를 중복해서 작성해야 하며, UserService 클래스 전체가 비대해지게 된다.


가장 큰 문제는 트랜잭션이나 로깅 및 보안 등의 부가 기능에 관심을 가지는 클래스가 UserService 에만 국한되지 않는 다는 것이다.
UserService와 비슷하게 서비스 로직을 수행 전 트랜잭션의 경계를 지정해주고 로깅이나 보안 등의 로직을 수행해야하는 클래스가 100개가 더 있다거나 혹은 생길지도 모르는 일이다.
그 말은 곧 100개의 클래스에 UserService 와 같이 중복되는 코드를 반복해서 작성해야 함을 의미한다.

만약 트랜잭션이나 로깅 및 보안 등의 부가 기능의 정책이나 API 가 변경되어야된다면 어떻게 될까?
이를 사용하는 100개의 클래스가 모두 함께 수정되어야 한다.
이는 다시 말해 100개의 클래스를 변경하는 이유는 비즈니스 로직의 변경 및 부가 기능의 변경 등 총 2가지라는 의미이며, 단일 책임 원칙을 위배한다.
결국 서비스 클래스의 응집도가 떨어지면 가독성이 나빠지며, 변경할 부분이 명확하게 드러나지 않게 되는 등 유지보수 측면에서 아쉬운점이 많아진다.

## Proxy 를 활용한 리팩토링
> UserService.java

```java 
public interface UserService {

    void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money);
}
```

>UserServiceImpl.java

```java 
@Service
@Primary
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserDao userDao;

    public void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money) {
        Account senderAccount = userDao.findAccountById(senderId);
        Account receiverAccount = userDao.findAccountById(receiverId);
        userDao.updateMoney(senderId, senderAccount.withdraw(money));
        userDao.updateMoney(receiverId, receiverAccount.add(money));
    }
}

```

> UserServiceProxy.java

```java 
@Service
@RequiredArgsConstructor
public class UserServiceProxy implements UserService {

    private final UserService target;
    private final PlatformTransactionManager transactionManager;

    @Override
    public void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money) {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            //로깅 관련 로직 추가
            //보안 관련 로직 추가
            target.sendMoneyToAnotherUser(senderId, receiverId, money);
            transactionManager.commit(transaction);
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }
}

```

프록시는 클라이언트가 사용하려고 하는 실제 타깃처럼 위장해서 요청을 받는다.
**UserServiceProxy** 크랠스와 **UserServiceImpl** 클래스 모두 동일한 **UserService** 인터페이스를 구현한다.
**UserServiceProxy 클래스**의 UserService 타입 **target 필드**는 <u>실제 핵심 비즈니스 로직을 구현한 UserServiceImpl 인스턴스를 주입한다.</u>

프록시 객체에 트랜잭션 등 부가 기능 관련 로직을 위치시키고, 클라이언트 요청이 발생하면 실제 타깃 객체는 프록시로부터 요청을 위임받아 핵심 비즈니스로직을 실행한다.
이를 **데코레이터 패턴** 이라고한다.

이와 같은 방법으로 핵심 비즈니스 로직과 부가 기능 관심사를 분리할 수 있었지만 **여전히 한계가 분명하다.**
100개의 클래스가 이와 비슷한 기능을 요구한다면 100개의 프록시 클래스를 생성하고 인터페이스 메서드를 일일히 구현해야 한다.


### Proxy 를 편하게 생성하는 방법

다행히 이러한 별도의 프록시를 번거롭게 생성하는 작업을 생략하는 방법이 존재한다.
Java의 Reflection API 를 이용하거나, Spring ProxyFactoryBean 등을 사용하는 것이다.
해당 내용들을 전부 다 다루기에는 분량이 너무 방대하고 관심이 있다면 토비의 스프링 1권 6장을 참고하면 좋을 듯 하다.

아무튼, 스프링에서는 Bean을 자동으로 프록시로 만들어주는 매커니즘이 존재한다. 바로 `DefaultAdvisorAutoProxyCreator` 라는 특별한 클래스이다.
`BeanPostProcessor` 라는 Bean 후처리기 인터페이스를 확장한 클래스이며, 동작 플로우는 다음과 같다.

1. Spring Container는 해당 후처리기가 Bean으로 등록되어 있으면 Bean들을 생성할 때 후처리기에 보내 후처리 작업을 요청한다.
2. Bean이 프록시 적용 대상이라면, 후처리기는 타깃 Bean을 프록시로 감싼 오브젝트로 바꿔치기 하여 Spring Container에게 반환한다.

이러한 매커니즘을 활용하기 위해서는 추가적인 정보를 제공해야 한다

- 어떤 작업을 수행할 것인가?
- 해당 작업을 수행할 대상은 누구인가?


## AOP(Aspect-Oriented Programming)

관점 지향 프로그래밍이란 OOP로 독립적으로 분리하기 어려운 **부가 기능**을 모듈화하는 방식이다. 이 글 에서 트랜잭션 관리와 같은 부분이 바로 부가 기능 모듈이며, 이를 Aspect 라고 한다.
핵심 비즈니스 로직을 담고 있지는 않지만 어플리케이션에 부가됨으로써 의미를 갖는 특별한 모듈이다. AOP는 핵심 비즈니스 로직과 부가 기능 Aspect 를 분리하는 등 OOP 를 보완하는 역할이다.

AOP 기능을 제공하는 프레임워크나 라이브러리를 사용하면, 번거로운 프록시 클래스 작성없이 UserService 비즈니스 로직에서 트랜잭션이라는 부가 기능 관심사를 간편하게 분리할 수 있다.
더불어 다양한 클래스가 Aspect 를 재활용하며 공통 사용할 수 있다.

### Aspect 구성

Aspect 는 부가될 기능을 정의한 Advice 와, 해당 Advice 를 어디에 적용할 지를 결정하는 Pointcut 정보를 가지고 있다.

### 구현 방법

1. Spring AOP 를 활용한다.

2. AspectJ를 사용한다.

- AspectJ는 컴파일된 타깃의 클래스 파일을 수정하거나, 클래스가 JVM에 로딩되는 시점에 바이트 코드를 조작함으로써 AOP 를 적용한다.
- 프록시 방식보다 더 다양한 지점에서 부가 기능을 부여할 수 있다.


### AspectJ 를 활용한 리팩토링

> TxAspect.java

```java 

@Aspect
@Component
@RequiredArgsConstructor
public class TxAspect {

    private final PlatformTransactionManager transactionManager;

    @Pointcut("execution(* com.demo.user.UserService.send*(..))")
    public void getUsers() {
    }

    @Pointcut("execution(* com.demo.user.BankService.update*(..))")
    public void getBanks() {
    }

    @Around("getUsers() || getBakns()")
    public Object applyTx(ProceedingJoinPoint joinpoint) throws Throwable {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            Object object = jointPoint.proceed();
            transactionManager.commit(transaction);
            return object;
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }
}

```

- @Pointcut 애너테이션에 표현식을 달아 특정 패키지의 `send` 나 `update` 로 시작하는 메서드들을 실행할 때 AOP 부가 기능을 적용하겠다고 지정한다.
- 이러한 AOP 적용을 통해 UserService의 메서드는 별도의 트래잭션 관리 기능을 제거하고 핵심 비즈니스 로직만 남게된다.


## 마치며

사실 우리가 흔히 보는 @Transational 애너테이션 또한 AOP 가 적용된 대표 사례이다. Spring은 @Transational 이라는 애너테이션을 메서드에 부착하면 예외 발생 여부에 따라 해당 트랜잭션을 커밋하거나 롤백한다.
내부적으로 @Transational 이 붙은 오브젝트에 대해 프록시를 생성하고, @Transational 로 지정한 메서드를 호출하면 트랜잭션을 선언하겠다는 Pointcut과 Advice 를 정보를 바탕으로 부가 기능 관심사를 수행하는 것이다.
