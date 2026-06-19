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
    APPLICATION_ACCESS_DENIED(HttpStatus.FORBIDDEN, "지원자 목록 조회 권한이 없습니다."),
    APPLICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "지원 내역을 찾을 수 없습니다."),

    PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없습니다."),
    PROFILE_NOT_PUBLIC(HttpStatus.FORBIDDEN, "비공개 프로필입니다."),
    EMAIL_REQUIRED_FOR_PUBLIC(HttpStatus.BAD_REQUEST, "공개 프로필에는 연락 이메일이 필요합니다."),

    BOOKMARK_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 북마크된 공고입니다."),
    BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "북마크를 찾을 수 없습니다."),

    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "그룹을 찾을 수 없습니다."),
    GROUP_ALREADY_OWNED(HttpStatus.CONFLICT, "이미 생성한 그룹이 있습니다."),
    GROUP_ACCESS_DENIED(HttpStatus.FORBIDDEN, "그룹장만 가능한 작업입니다."),
    GROUP_OWNER_CANNOT_JOIN(HttpStatus.BAD_REQUEST, "본인이 만든 그룹에는 가입할 수 없습니다."),
    GROUP_ALREADY_MEMBER(HttpStatus.CONFLICT, "이미 가입했거나 가입 신청한 그룹입니다."),
    GROUP_JOIN_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "가입 가능한 그룹은 최대 3개입니다."),
    GROUP_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "그룹 멤버를 찾을 수 없습니다."),
    GROUP_MEMBERSHIP_REQUIRED(HttpStatus.FORBIDDEN, "그룹에 가입 승인된 멤버만 지원할 수 있습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}