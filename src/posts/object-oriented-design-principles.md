---
title: "객체 지향 SOLID 원칙 , 왜 필요한걸까?"
date: "2025-08-14"
tags: ["Java","SOLID"]
description : 객체 지향의 SOLID 원칙이 생겨난 배경과 필요한 이유를 알아보자.
---


## 서론

사실 자바라는 언어를 처음 접하거나 개발을 시작할 때, 비교적 빨리 들어 볼 수 있는 개념이 
객체지향 설계 원칙 (SOLID) 라고 생각한다.

그렇기에 난 이 원칙의 개념에 대해서 이해하는건 사실 별로 어렵지 않았다.

하지만 정말 이해하고 **"이 원칙들을 지켜가며 개발하고 있는가?"** 에 대한 물음에 나는 아니였다.

단지 "**Controller** , **Service** , **Repository** 를 레이어로 분리하는게 좋다", "직접적인 구현체가 아닌 인터페이스로 선언하는게 더 좋다" 라는 말을 듣고
대부분 그렇다고 하니까 그렇게 개발을 해왔던 것 같다. 

하지만 요즘 원리나 이해보다 중요하다고 생각이 들었던 건 바로 **"기술 혹은 개념이 생겨난 배경과 상황"** 이다.

이 **"배경"** 혹은 **"상황"** 에 내가 배운 기술을 써야하는 모든 이유가 들어있다고 생각하기 때문이다.

---

## SOLID 원칙의 배경

당시 1990년대 후반에서 2000년대 초반에는 C++ , Java 와 같은 객체 지향 언어가 큰 인기를 끌었다.
사람들은 **객체** 라는 개념이 마치 **레고 블록** 처럼 , 한번 잘 만들어두면 어디서든
재사용하고 쉽게 조립해서 거대한 프로그램을 만드는 해결책이라고 생각했다.

하지만 현실은 좀 달랐다.

개발자들은 레고 블록 ( 객체 ) 를 만들긴 했지만 , 그 레고 블록들을 **강력한 접착제** 를 사용해서 붙인 것과
같은 방식으로 개발했다.

그 결과, 한번 조립된 완성품은 다음과 같은 문제들을 야기했다.

1. 경직성
    - 단지 아주 작은 레고 블록 하나만 바꾸고 싶은데 , **강력 접착제** 때문에 전부 다 부숴야했다. 즉, **사소한 변경 하나가 시스템 전체에 연쇄적인 수정을 일으켰다.**

2. 취약성
   - 강력 접착제를 잘 제거하고 아주 작은 부분만 아주 조심스럽게 바꿨는데 , 전혀 상관 없어 보이던 먼 곳의 블럭이 쩍 하고 갈라저벼렸다. 즉, **하나를 수정하면 예상치 못한 다른 곳에서 버그가 발생했다.**

3. 부동성
   - 정말 잘 만든 레고 블록 부품이 있어서 떼어내 사용하려고 했는데 뗄 수가 없었다. 즉 , 한번 만든 코드는 다른 프로젝트에서 사용하기가 거의 불가능했다.


이러한 문제들 때문에 프로젝트는 점점 더 유지보수하기 어려워졌고 , 버그는 넘쳐나고 사람들은
"객체 지향은 실패했다" 고 까지 말하기 시작했다.


## 좋은 건축에는 '원칙' 이 필요하다.

객체지향이 이러한 문제에 직면했을 때 **로버트 C.마틴** 과 같은 소프트웨어 공학자들이 이 문제를 해결하기 위해 나섰다.
그들은 "레고 블록을 만드는 기술(OOP) 가 문제가 아니라, **블록을 잘못 조립하는 방식이 문제다.**" 라고 말했다.

건물을 지을 때 기둥 , 벽 , 창틀을 제멋대로 붙이지 않고 '건축 원칙' 이 필요한 것 처럼,
소프트웨어 또한 유연하고 튼튼하게 만들기 위해서는 **"객체지향 설계 원칙"** 이 필요한 것이다.

즉 , SOLID 는 바로 이 **'강력 접착제로 붙인 레고 덩어리'** 같은 코드를 , 언제든지 쉽게 뺏다 끼웠다 할 수 있는 
**'진짜 레고'** 처럼 만들기 위해 탄생한 5가지 핵심 설계 원칙이다.

<br>

**S (단일 책임 원칙)**
- 레고 블록 하나는 '바퀴'면 바퀴, '창문'이면 창문처럼 딱 한 가지 기능만 하게 만들어서, 바퀴를 고칠 때 창문이 영향받지 않게 하자는 원칙.

**O (개방-폐쇄 원칙)**
- 새로운 '스포일러' 부품을 추가하고 싶을 때, 기존의 자동차 몸체를 부수지 않고 그냥 위에 꽂기만 하면 되도록 만들자는 원칙. (경직성 해결)

**L (리스코프 치환 원칙)** 
- '트럭 바퀴'는 '자동차 바퀴'의 한 종류이므로, 일반 자동차 바퀴가 들어갈 자리에 트럭 바퀴를 끼워도 자동차가 문제없이 굴러가야 한다는 원칙. (취약성 해결)

**I (인터페이스 분리 원칙)**
- 자동차 운전에 필요한 '핸들 , 페달' 인터페이스와 정비에 필요한 '엔진 점검' 인터페이스를 분리해서, **운전자는 정비 기능까지 알 필요가 없게 만들자는** 원칙.

**D (의존관계 역전 원칙)**
- 바퀴 , 엔진, 차제를 만들 대 레고의 동그란 돌기 라는 표준 규격에만 맞춰서 만들자는 원칙. 이렇게 하면 어떤 부품이든 서로 쉽게 조립하고 교체 할수 있다.

---

## 원칙을 실제로 적용해야하는 상황을 알아야한다.


### S 단일 책임 원칙 (SRP)
- 클래스는 단 하나의 책임만 가져야 한다.

**상황**
- 사용자가 회원가입을 하면 DB에 저장하고 환영 이메일까지 보내고 있다.


```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final JavaMailSender mailSender; // 이메일 발송 책임

    // ... 생성자 ...

    public void register(UserDto dto) {
        // 1. 책임: 사용자 등록 로직
        User user = new User(dto.getEmail(), dto.getPassword());
        userRepository.save(user);

        // 2. 책임: 이메일 발송 로직
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("가입을 환영합니다!");
        message.setText("회원가입이 성공적으로 완료되었습니다.");
        mailSender.send(message);
    }
}
```

**문제점**
- 나중에 이메일 템플릿이나 발송 방식이 바뀌면 , 아무 상관 없는 UserService 도 수정해야한다.


**해결책**
- **이메일 발송** 책임을 `EmailService` 로 완전히 분리하고, 두 서비스는 `이벤트` 를 통해 느슨하게 소통한다.

```java

// UserService.java (사용자 등록 책임만 남음)
@Service
public class UserService {
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher; // ✨ 이벤트 발행기

    public void register(UserDto dto) {
        User user = new User(dto.getEmail(), dto.getPassword());
        userRepository.save(user);

        // "사용자가 가입했음!" 이라는 이벤트만 발행하고 자기 할 일은 끝냄
        eventPublisher.publishEvent(new UserRegisteredEvent(user));
    }
}

// EmailService.java (이메일 발송 책임)
@Service
public class EmailService {
    private final JavaMailSender mailSender;

    @EventListener // ✨ UserRegisteredEvent를 구독
    public void sendWelcomeEmail(UserRegisteredEvent event) {
        User user = event.getUser();
        SimpleMailMessage message = new SimpleMailMessage();
        // ... 메일 내용 설정 및 발송 ...
        mailSender.send(message);
    }
}
```

**개선점**

- 이제 `UserService`는 이메일 발송 로직을 전혀 알 수가 없다. 이메일 관련 변경은 `EmailService` 에서만 일어나고 각 클래스의 책임이 명확해졌다.


---
<br>

### O 개방-폐쇄 원칙 (OCP)
- 확장에는 열려 있고 , 수정에는 닫혀 있어야 한다.

**상황**
결제 시점에, 사용자의 등급에 따라 다른 할인율을 적용하는 기능.

```java
@Service
public class OrderService {
    public int getDiscountedPrice(User user, int price) {
        if ("VIP".equals(user.getGrade())) {
            return price * 0.8; // 20% 할인
        } else if ("GOLD".equals(user.getGrade())) {
            return price * 0.9; // 10% 할인
        }
        // 'SILVER' 등급을 추가하려면 여기에 else if를 또 추가해야 함
        return price;
    }
}
```

**문제점**
- 새로운 등급(Silver) 등 이 추가되면 `if-else` 문을 직접 수정해야한다.
- 새로운 할인 정책이 생길때맘다 기존의 `OrderService` 코드를 직접 건드려야 한다.


**해결책**
- 인터페이스와 실제 구현체로 기능 확장을 용이하게 한다.
- 할인 정책이라는 '역할'을 인터페이스로 정의하고 , 각 정책을 별도의 클래스로 구현한다.

```java

// DiscountPolicy.java (Interface)
public interface DiscountPolicy {
    boolean supports(User user);
    int applyDiscount(int price);
}

// VipDiscountPolicy.java (Implementation)
@Component
public class VipDiscountPolicy implements DiscountPolicy {
    @Override public boolean supports(User user) { return "VIP".equals(user.getGrade()); }
    @Override public int applyDiscount(int price) { return price * 0.8; }
}

// GoldDiscountPolicy.java (Implementation)
@Component
public class GoldDiscountPolicy implements DiscountPolicy {
    @Override public boolean supports(User user) { return "GOLD".equals(user.getGrade()); }
    @Override public int applyDiscount(int price) { return price * 0.9; }
}

// OrderService.java (전략을 찾아 사용만 함)
@Service
public class OrderService {
    private final List<DiscountPolicy> policies; // Spring이 모든 구현체를 주입해 줌

    public int getDiscountedPrice(User user, int price) {
        // 자신에게 맞는 정책을 찾아 할인을 적용
        return policies.stream()
                .filter(p -> p.supports(user))
                .findFirst()
                .map(p -> p.applyDiscount(price))
                .orElse(price);
    }
}

```

**개선점**
이제 `Silver` 등급 정책을 추가하고 싶다면 인터페이스를 구현하는 `SilverDiscountPolicy` 클래스만 새로 만들면 된다.
`OrderService` 코드는 전혀 수정할 필요가 없다.

---
<br>

### L 리스코프 치환 원칙(LSP)
- 하위 타입은 언제나 상위 타입으로 대체할 수 있어야 한다.

**상황**
- 파일 업로드 기능을 만드는데, 로컬 서버에 저장하는 방식과 AWS S3에 저장하는 방식을 모두 지원.

**하위 클래스가 부모의 약속을 깨는 경우**
- S3 저장 방식은 외부 URL 생성이 가능하지만, 로컬 저장 방식은 불가능해서 예외를 던진다

```java
// FileStorage.java (Abstract Class)
public abstract class FileStorage {
    public abstract void save(File file);
    // 이 메소드는 "파일의 공개 URL을 반환한다"는 암묵적인 약속을 가짐
    public abstract String getPublicUrl(String fileName);
}

// S3Storage.java
public class S3Storage extends FileStorage { /* ... 구현 ... */ }

// LocalStorage.java
public class LocalStorage extends FileStorage {
    @Override
    public void save(File file) { /* 로컬에 저장 */ }

    @Override
    public String getPublicUrl(String fileName) {
        // 로컬 파일은 외부 URL이 없으므로 약속을 지킬 수 없음
        throw new UnsupportedOperationException("로컬 저장은 공개 URL을 지원하지 않습니다.");
    }
}

```

**문제점**
`FileStorage` 타입을 사용하는 코드는 `getPublicUrl()`이 항상 성공할 것이라 기대하지만, `LocalStorage` 객체가 들어오면 런타임 에러가 발생합니다.

**해결책**
- 역할을 더 작은 인터페이스로 분리한다.
- 모든 파일 저장소가 `공개 URL 생성` 기능을 가져야 한다는 가정을 버리고, 해당 기능이 가능한 객체만 구현하도록 인터페이스를 분리한다.


```java
// FileStorage.java (Interface, 공통 기능만 정의)
public interface FileStorage {
    void save(File file);
    File download(String fileId);
}

// PublicUrlAvailable.java (Interface, URL 생성 기능만 정의)
public interface PublicUrlAvailable {
    String getPublicUrl(String fileId);
}

// S3Storage.java (두 가지 역할을 모두 수행)
@Service("s3Storage")
public class S3Storage implements FileStorage, PublicUrlAvailable { /* ... */ }

// LocalStorage.java (기본 역할만 수행)
@Service("localStorage")
public class LocalStorage implements FileStorage { /* ... */ }

```
**개선점**
- 이제 클라이언트 코드는 자신이 필요한 기능(인터페이스)에만 의존한다. URL 생성이 필요하다면 PublicUrlAvailable 타입을,
파일 저장만 필요하다면 FileStorage 타입을 주입받으면 되므로 런타임 에러의 위험이 사라진다.

**주의할 점**
- "하나의 변수가 모든 것을 하게 만들지 말고, 필요한 기능(역할)에 맞는 변수를 각각 사용하라."

**잘못된 예**
```java 
    public class PlanningTeam {
    // "김민준 씨를 '영업팀' 역할로만 데려온다."
    private final FileStorage fileStorage;

    public void startProject() {
        fileStorage.save(); // ✅ 영업팀의 역할이므로 가능.
        fileStorage.getPublicUrl(); // ❌ 불가능! 컴파일러가 "영업팀 업무 매뉴얼에 그런 건 없습니다!" 하고 막는다.
    }
}
```

**올바른 예**

```java
public class SmartPlanningTeam {
    // ✨ 필요한 역할을 모두 명시적으로 선언한다!
    private final FileStorage fileStorage;
    private final PublicUrlAvailable urlGenerator;

    // Spring에게 각 역할에 맞는 전문가를 요청한다.
    public SmartPlanningTeam(@Qualifier("s3Storage") FileStorage fileStorage,
                             @Qualifier("s3Storage") PublicUrlAvailable urlGenerator) {
        this.fileStorage = fileStorage;
        this.urlGenerator = urlGenerator;
    }

    public void startProject() {
        // 영업 역할은 fileStorage 변수에게 요청
        fileStorage.save();

        // 개발 역할은 urlGenerator 변수에게 요청
        String url = urlGenerator.getPublicUrl();
    }
}
```

---

<br>

### I 인터페이스 분리 원칙(ISP)
- 클라이언트는 자신이 사용하지 않는 메소드에 의존해서는 안된다.

**상황**
- 사용자 관련 서비스가 일반 사용자의 기능과 관리자의 기능을 모두 포함
- `UserProfileController` 는 프로필 조회 기능만 필요한데, 불필요하게 `banUser` 같은 관리자 기능까지 알게된다.

```java 
// 거대한 IUserService 인터페이스
public interface IUserService {
    UserProfile viewProfile(Long userId);
    void updateProfile(Long userId, ProfileDto dto);
    void banUser(Long userId);      // 관리자 기능
    void listAllUsers();            // 관리자 기능
}

// UserProfileController.java
@RestController
public class UserProfileController {
    private final IUserService userService; // 불필요한 기능까지 의존
    // ...
}
```

**문제점**
- 관리자 기능 관련 인터페이스가 변경되면 , 아무 상관없는 `UserProfileController` 코드도 영향을 받을 수 있음.

**해결책**
- 역할을 기준으로 인터페이스를 분리한다.

```java
// UserProfileService.java (Interface, 일반 사용자용)
public interface UserProfileService {
    UserProfile viewProfile(Long userId);
    void updateProfile(Long userId, ProfileDto dto);
}

// UserAdminService.java (Interface, 관리자용)
public interface UserAdminService {
    void banUser(Long userId);
    void listAllUsers();
}

// UserServiceImpl.java (필요한 인터페이스들을 모두 구현)
@Service
public class UserServiceImpl implements UserProfileService, UserAdminService { /* ... */ }

// UserProfileController.java (자신에게 필요한 인터페이스만 의존)
@RestController
public class UserProfileController {
    private final UserProfileService userProfileService; // ✨ 책임이 명확해짐
    // ...
}
```

**개선점**
- `UserProfileController` 는 이제 관리자 기능의 존재 자체를 모른다. 의존성이 최소화 되어 코드가 훨씬 깔끔하고 안전해졌다.



---

### D 의존관계 역전 원칙(DIP)
- 구체적인 것에 의존하지 말고 , 추상적인 것에 의존하라.

**상황**
- 컨트롤러가 서비스를 사용하는 , 웹 개발의 가장 기본적인 구조
- 구체적인 클래스에 직접 의존

```java
@RestController
public class UserController {
    // 구체적인 클래스에 직접 의존. 최악의 코드!
    private final UserServiceImpl userService = new UserServiceImpl();

    @PostMapping("/register")
    public void register(UserDto dto) {
        userService.register(dto);
    }
}
```

**문제점**
- `UserServiceImpl` 을 다른 구현체로 바꿀 수 없으며 , 단위 테스트가 거의 불가능하다.

**해결책**
- 인터페이스에 의존하고 외부에서 주입
- 컨트롤러는 `UserService` 라는 인터페이스만 알고 , 실제 객체는 스프링이 주입

```java

@RestController
public class UserController {
    // 추상적인 역할(인터페이스)에만 의존
    private final UserService userService;

    // 생성자를 통해 외부(스프링)에서 의존성을 주입받음
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public void register(UserDto dto) {
        userService.register(dto);
    }
}
```

**개선점**
- 이것이 바로 스프링 프레임워크의 핵심인 **의존성 주입** 이다.
- `UserController`는 이제 `UserService`의 구현체가 `UserServiceImpl`인지, `TestUserService`인지 전혀 신경 쓰지 않는다. 이로 인해 코드가 유연해지고 테스트하기 매우 쉬워진다.

---
<br>


SOLID 원칙에 대해서 알아보았는데, 이것은 더 좋은 설계를 위한 가이드이고 모든 상황에서의 정답은 아니다.
너무나 많고 다양한 상황들이 있을 것이고 때로는 이러한 원칙들이 시스템을 더 복잡하게 만들기도 한다.

이 원칙들을 적용해야 할지 말지 고민이 될 땐 
"이 설계가 미래의 나와 동료들에게 도움이 될 것인가?" 를 생각해보면 좋을 것이다.

예를 들면 ,

- 인터페이스를 도입한다면 나중에 기능을 바꿀 때 시간을 아껴주고 버그를 막아줄까?
- 간단한 프로젝트와 기능에 이것을 추가함으로써 얻는 이점이 들일 시간과 비교하여 합리적인가?

모든 설계 원칙은 코드를 다루는 사람을 위한 것이고 우리의 생산성과 안정성을 높이기 위한 도구일 뿐이다.
이 균형을 잘 유지하면 좋은 개발자가 될 수 있을 것이다.