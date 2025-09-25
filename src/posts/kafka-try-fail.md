---
title: "Kafka 에서 처리에 실패한 메시지 재시도 하기"
date: "2025-09-24"
tags: ["Kafka"]
description : "Kafka 에서 메시지 처리에 실패한다면 어떻게 처리해야 할까?"
---


## 서론

앞서 카프카와 같은 메시지 큐를 활용해 비동기 처리에 대해서 알아보았다.
근데 비동기 처리를 할 때의 한계점이 작업의 실제 성공 여부를 확인하지 않고 응답을 먼저 보내버린다는 단점이 있었다.

그리고 그 단점을 보완하기 위해 재시도 하거나 여러 번의 재시도 끝에도 실패한 메시지를 별도로 보관하는 **Dead Letter Topic(DLT** 을 활용하는 방식을 주로 활용한다.




## 의도적으로 처리에 실패하는 상황 만들기

처리에 실패하는 상황을 만들기 위해서는 Consumer 코드를 수정해야 한다. 
기존 Consumer 코드는 아래와 같다.

```java 
@Service
public class EmailSendConsumer {

	@KafkaListener(
		topics = "email.send",
		groupId = "email-send-group"
	)
	public void consume(String message){
		System.out.println("카프카로부터 받아온 메시지 :" + message);

		EmailSendMessage emailSendMessage =  EmailSendMessage.fromJson(message);

		// .. 실제 이메일 발송 로직은 생략..

		try{
			Thread.sleep(3000);

		}catch (InterruptedException e){
			throw  new RuntimeException("이메일 발송 실패");
		}

		System.out.println("이메일 발송 완료");
	}
}
```
기존에 코드에 실패하는 로직 코드를 추가하여 작성해주자.


```java 
@Service
public class EmailSendConsumer {

	@KafkaListener(
		topics = "email.send",
		groupId = "email-send-group"
	)
	public void consume(String message){
		System.out.println("카프카로부터 받아온 메시지 :" + message);

		EmailSendMessage emailSendMessage =  EmailSendMessage.fromJson(message);

		// 실패 로직
		if(emailSendMessage.getTo().equals("fail@naver.com")){
			System.out.println("잘못된 이메일 주소로 인해 발송 실패");
			throw new RuntimeException("잘못된 이메일 주소로 인해 발송 실패");
		}
		try{
			Thread.sleep(3000);

		}catch (InterruptedException e){
			throw  new RuntimeException("이메일 발송 실패");
		}

		System.out.println("이메일 발송 완료");
	}
}

```


해당 로직을 추가하고 Postman 으로 프로듀서 서버에 요청을 보내게 되면 
이메일 전송 완료 응답은 오지만 콘슈머 서버에서는 잘못된 이메일 주소로 인해 발송 실패 라는 로그가 찍히게 된다. 

그런데, 우리는 아무런 재시도 코드를 작성하지 않았는데 로그에는 실패 로그가 여러번 나타나있다.

그리고 ERROR 부분 로그를 보게 되면 아래와 같은 로그가 있다.

```console 
ERROR 19096 --- [ntainer#0-0-C-1] o.s.kafka.listener.DefaultErrorHandler   : Backoff FixedBackOff{interval=0, currentAttempts=10, maxAttempts=9} exhausted for email.send-0@7

```

이 로그에서 **interval** 은 재시도를 시도하는 시간 간격을 의미한다.
**currentAttempts** 는 지금까지 시도한 횟수를 의미한다.
**maxAttempts** 는 재시도의 횟수이다.

간단히 설명하면 최초의 시도 1회와 재시도의 횟수(maxAttempts) 9회 를 합쳐 총 10번(currentAttempts) 을 시도 한 것이다.


이렇게 별도의 설정을 하지 않았는데 이미 기본 값으로 재시도에 대한 전략이 설정되어있다.
우리는 이 설정을 조금 변경해서 현업에서 쓰일만 한 설정 값으로 적용 시켜보자.



```java 

@Service
public class EmailSendConsumer {

	@KafkaListener(
		topics = "email.send",
		groupId = "email-send-group"
	)
	//
	@RetryableTopic(
		// 총 시도 횟수 설정
		attempts = "5",
		// 재시도 를 하는 간격
		// 배수의 간격으로 재시도 한다 ( 1회 1초 , 2회 2초, 3회 4초 ... )
		backoff = @Backoff(delay = 1000, multiplier = 2)
	)
	public void consume(String message){
		System.out.println("카프카로부터 받아온 메시지 :" + message);

		EmailSendMessage emailSendMessage =  EmailSendMessage.fromJson(message);

		
		if(emailSendMessage.getTo().equals("fail@naver.com")){
			System.out.println("잘못된 이메일 주소로 인해 발송 실패");
			throw new RuntimeException("잘못된 이메일 주소로 인해 발송 실패");
		}
		try{
			Thread.sleep(3000);

		}catch (InterruptedException e){
			throw  new RuntimeException("이메일 발송 실패");
		}

		System.out.println("이메일 발송 완료");
	}
}


```

현업에선 보통 재시도 횟수를 3~5회 정도로 설정한다.
왜냐하면 재시도 횟수를 너무 많이 하면 시스템 부하가 커질 수 밖에 없기 때문이고,
반면에 재시도 횟수를 너무 줄이게 되면 사소한 일시적인 장애에 대응하기 어렵기 때문이다.

그래서 multiplier 를 통해 재시도를 하면 할수록 간격을 늘려 설정한다.

해당 설정을 적용하고 다시 콘슈머 서버를 재실행 해보자.
그리고 나서 api 요청을 다시 보내면 순식간에 찍히던 '이메일 발송 실패' 라는 로그가 
우리가 설정한 재시도 간격에 맞게 나타나게 된다.



## 재시도를 여러 번 했음에도 불구하고 작업이 실패했을 때 

사용자는 응답으로 성공을 받았기 때문에 이메일 발송 작업이 정상적으로 처리가 되었을 것이라고 생각할 것이다.

이런 상황에서 우리는 어떻게든 메시지를 처리해내야 한다.

이럴 때는 Dead Letter Topic (DLT) 라는 별도 토픽을 활용하여, 재시도까지 실패한 메시지를 안전하게 보관하고 나중에 관리자가 확인해서 수동으로라도 처리할 수 있도록 구성 할 수 있도록 해야 한다.


## Dead Letter Topic 이란?

DLT 는 오류로 인해 처리할 수 없는 메시지를 임시로 저장하는 토픽이다.
Kafka 에서는 재시도까지 실패한 메시지를 다른 토픽에 따로 저장해서 유실을 방지하고 후속 조치를 가능하게 만든다.

> 그럼 DLT 는 왜 사용하는 걸까?

1. 실패한 메시지를 DLT 토픽에 저장해놓기 때문에, 실패한 메시지가 유실되는 걸 방지할 수 있다.
2. DLT 토픽에 실패한 메시지가 저장되어 있기 때문에, 사후에 실패 원인을 분석할 수 있다.
3. DLT 토픽에 실패한 메시지가 저장되어 있기 때문에, 처리되지 못한 메시지를 수동으로 처리할 수 있다.

## DLT 를 활용해 재시도에 실패한 메시지 따로 보관하기

사실 Spring kafka 는 `@RetryableTopic` 을 사용하면 자동으로 DLT 토픽을 생성하고 메시지를 전송해준다.
기본적으로 만드는 DLT 토픽 이름은 `{기존 토픽명}-dlt` 형태로 지어진다. 일관적인 DLT 토픽 이름을 위해 직접 DLT 토픽명을 별도로 다시 설정해주자.

```java 
	@RetryableTopic(
		// 총 시도 횟수 설정
		attempts = "5",
		// 재시도 를 하는 간격
		// 배수의 간격으로 재시도 한다 ( 1회 1초 , 2회 2초, 3회 4초 ... )
		backoff = @Backoff(delay = 1000, multiplier = 2),
		dltTopicSuffix = ".dlt" // 옵션 추가
	)
```

위와 같이 `dltTopicSuffix` 를 추가하고 요청을 보내보자.
요청을 보내고 난 후 터미널에서 토픽들을 조회하면 새로운 토픽들이 생겼을 것이다.

```shell 
PS C:\kafka_2.13-2.8.0> .\bin\windows\kafka-topics.bat --bootstrap-server localhost:9092 --list                         __consumer_offsets
email.send
email.send-dlt // dltTopicSuffix 를 생성하기 전에 이미 기본적인 설정때문에 생성된 토픽
email.send-retry  // 재시도 요청 때문에 생긴 토픽
email.send-retry-1000   // 재시도 요청 때문에 생긴 토픽
email.send-retry-2000   // 재시도 요청 때문에 생긴 토픽
email.send-retry-4000   // 재시도 요청 때문에 생긴 토픽
email.send-retry-8000   // 재시도 요청 때문에 생긴 토픽
email.send.dlt // dlt 토픽 생성

```

그럼 재시도에 실패한 메시지도 dlt 토픽에 잘 보관하고 있을까?
한번 확인해보자.

```shell 
PS C:\kafka_2.13-2.8.0> .\bin\windows\kafka-console-consumer.bat --bootstrap-server localhost:9092 --topic email.send.dlt --from-beginning
{"from":"sender@naver.com","to":"fail@naver.com","subject":"제목","body":"내용"}"}

```

실패했던 메시지를 제대로 보관하고 있다.
그리고 콘슈머 서버에 콘솔에 마지막을 보게 되면 로그가 하나 찍혀 있다.
'메시지 처리에 실패하고 나서 email.send.dlt' 에 따로 보관 했다는 로그이다.
```console 
INFO 17908 --- [ner#0.dlt-0-C-1] o.s.k.retrytopic.RetryTopicConfigurer    : Received message in dlt listener: email.send.dlt-0@0

```


이렇게 재시도 조차 실패한 메시지를 DLT 토픽에 따로 보관하는 것까지 완료했다.
그럼 이 실패한 메시지에 대해서 조치를 취해야 하는데, 그 방법에 대해서도 알아보자.


## 재시도조차 실패한 메시지를 사후 처리하기

재시도까지 실패한 메시지를 `email.send.dlt` 와 같은 DLT 에 안전하게 저장하는 방법을 배웠다.
하지만 DLT 에 저장하는 것만으로는 문제가 해결되지 않는다. 실패한 메시지를 확인하고, 적절한 조치를 취하는 과정이 필요하다.

## DLT 에 저장된 메시지를 사후 처리하는 방식

DLT 에 저장된 메시지는 여러 번의 재시도를 거쳤음에도 불구하고 실패한 메시지이기 때문에 분명 문제가 있는 메시지이다.
따라서 이 메시지는 수동으로 체크하고 조치를 취해야 한다. 따라서 현업에서는 DLT 에 저장된 메시지를 아래와 같은 방식으로 주로 처리한다.

1. **DLT** 에 <u>저장된 실패 메시지를 로그 시스템에 전송해 장애 원인을 추적할 수 있도록 한다.</u>
2. **DLT** 에 메시지가 저장되자마자 수동으로 대처할 수 있게 <u>알림을 설정한다.</u>
3. 알림을 받은 관리자는 로그에 쌓인 내용을 보고 장애 원인을 분석하고, 그에 맞게 메시지를 수동으로 처리한다.

여기서 3번째 내용 중에 '메시지를 수동으로 처리한다' 라는 부분을 더 자세히 살펴보자. 도대체 메시지를 수동으로 어떻게 처리한다는 걸까?
**대표적인 수동으로 처리하는 방식의 예시를 알아보자.**


**1. 메시지를 원래 토픽으로 직접 다시 보내기**
- 장애가 일시적이었고 지금은 해결된 경우

**2. 메시지 폐기하기**
- 메시지의 내용을 처리하려고 봤는데, 영구적으로 처리할 수 없는 메시지(ex. 탈퇴한 사용자, 형식 오류) 일 수도 있다. 그럴 때는 메시지 자체를 폐기한다. 단, 폐기할 때도 영구적으로 폐기하지 않고 혹시 모를 상황에 대비해 로그로 남겨둔다.

**3. (사후 처리) 잘못된 메시지 내용이 Kafka에 들어가지 않게 Producer 의 검증 로직 보완하기**
- 잘못된 메시지는 최대한 Producer 에서 검증할 수 있으면 검증해서 걸러야 한다. 이렇게 되면 잘못된 메시지가 kafka에 들어가지 않게되고, 사용자 입장에서도 잘못된 요청 값에 대해 실패의 응답을 받을 수 있기 때문에 대처해야 할 에러가 확연히 줄어든다.



이 방법들을 기반으로 실제 프로젝트 코드에서는 어떻게 작성되는지 살펴보자.


새로운 EmailSendDltConsumer 클래스를 생성해주자.

```java 
@Service
public class EmailSendDltConsumer {

	@KafkaListener(
		topics = "email.send.dlt",
		groupId = "email-send-dlt-group"
	)
	public void consume(String message) {
		// 로그 시스템에 전송
		System.out.println("로그 시스템에 전송" + message);

		// 알림 발송
		System.out.println("Slack 에 알림 발송");
	}
}
```

dlt 토픽을 주기적으로 확인하도록 `@KafkaListener` 어노테이션을 사용해 설정했다.
이제 재시도조차 실패한 메시지가 dlt 토픽에 보관된다면 그 보관된 메시지는 조회되고 '로그 시스템 전송' 혹은 'Slack 에 알림 발송' 로직이 실행될 것이다.
아래 로그를 보면 정상적으로 출력 로직들이 실행된 것을 볼 수 있다.

```console 
Caused by: java.lang.RuntimeException: 잘못된 이메일 주소로 인해 발송 실패
	at com.example.emailsendconsumer.EmailSendConsumer.consume(EmailSendConsumer.java:32) ~[main/:na]
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77) ~[na:na]
	at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:na]
	at java.base/java.lang.reflect.Method.invoke(Method.java:568) ~[na:na]
	at org.springframework.messaging.handler.invocation.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:169) ~[spring-messaging-6.2.11.jar:6.2.11]
	at org.springframework.kafka.listener.adapter.KotlinAwareInvocableHandlerMethod.doInvoke(KotlinAwareInvocableHandlerMethod.java:45) ~[spring-kafka-3.3.10.jar:3.3.10]
	at org.springframework.messaging.handler.invocation.InvocableHandlerMethod.invoke(InvocableHandlerMethod.java:119) ~[spring-messaging-6.2.11.jar:6.2.11]
	at org.springframework.kafka.listener.adapter.HandlerAdapter.invoke(HandlerAdapter.java:78) ~[spring-kafka-3.3.10.jar:3.3.10]
	at org.springframework.kafka.listener.adapter.MessagingMessageListenerAdapter.invokeHandler(MessagingMessageListenerAdapter.java:475) ~[spring-kafka-3.3.10.jar:3.3.10]
	... 17 common frames omitted

로그 시스템에 전송{"from":"sender@naver.com","to":"fail@naver.com","subject":"제목","body":"내용"}
Slack 에 알림 발송

```


## 끝으로

이번 학습으로 kafka 의 기본적인 개념과 프로듀서 서버, 콘슈머 서버를 알아보았다.
그렇다면 MSA 아키텍처에서 프로듀서 서버와 콘슈머 서버는 무엇일까?


예를들면, 회원 가입 시 회원 축하 이메일을 보낸다고 가정하면 회원 서버와, 이메일 서버가 존재할 것이다.
이 때는 회원 서버가 프로듀서 서버가 될 것이고 이메일 서버는 콘슈머 서버가 될 것이다.

회원 서버는 회원 가입을 처리 후 카프카에 이메일 발송을 위한 메시지를 넣게될 것이고,
이메일 서버는 그 메시지를 카프카에서 확인한 후에 처리를 하게 된다.

필자는 처음에 콘슈머 서버와 프로듀서 서버가 따로 존재해야하는가? 라는 의문점이 있었는데 어느정도 해결되었다.













