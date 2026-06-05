package wooriteam.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다."),
    SAME_PASSWORD(HttpStatus.BAD_REQUEST, "새 비밀번호가 현재 비밀번호와 동일합니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),

    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."),
    POST_ACCESS_DENIED(HttpStatus.FORBIDDEN, "공고에 대한 권한이 없습니다."),
    POST_ALREADY_CLOSED(HttpStatus.BAD_REQUEST, "이미 마감된 공고입니다."),

    ROLE_NOT_FOUND(HttpStatus.NOT_FOUND, "모집 역할을 찾을 수 없습니다."),
    ROLE_NOT_IN_POST(HttpStatus.BAD_REQUEST, "해당 역할은 이 공고에 속하지 않습니다."),

    ALREADY_APPLIED(HttpStatus.CONFLICT, "이미 지원한 역할입니다."),
    APPLICATION_ACCESS_DENIED(HttpStatus.FORBIDDEN, "지원자 목록 조회 권한이 없습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}