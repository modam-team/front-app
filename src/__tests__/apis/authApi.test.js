import { appleLogin, kakaoLogin, reissueToken } from "@apis/authApi";
import { client } from "@apis/clientApi";
import { getToken, saveToken } from "@utils/secureStore";

// 1) axios client mock
jest.mock("@apis/clientApi", () => ({
  client: {
    post: jest.fn(),
  },
}));

// 2) secureStore mock
jest.mock("@utils/secureStore", () => ({
  getToken: jest.fn(),
  saveToken: jest.fn(),
}));

describe("authApi token 저장 로직", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("appleLogin: refreshToken이 null이면 refreshToken 저장을 호출하지 않는다", async () => {
    // given: 서버가 refreshToken을 안 주는 케이스
    client.post.mockResolvedValueOnce({
      data: {
        success: true,
        responseDto: {
          accessToken: "ACCESS_APPLE",
          refreshToken: null,
          expiresIn: 3600,
        },
      },
    });

    // when
    await appleLogin("CODE");

    // then: accessToken은 저장
    expect(saveToken).toHaveBeenCalledWith("accessToken", "ACCESS_APPLE");
    expect(saveToken).toHaveBeenCalledWith("expiresIn", "3600");

    // then: refreshToken은 저장하면 안 됨
    expect(saveToken).not.toHaveBeenCalledWith(
      "refreshToken",
      expect.anything(),
    );
  });

  it("kakaoLogin: refreshToken이 undefined이면 refreshToken 저장을 호출하지 않는다", async () => {
    client.post.mockResolvedValueOnce({
      data: {
        success: true,
        responseDto: {
          accessToken: "ACCESS_KAKAO",
          // refreshToken 없음
          expiresIn: 1800,
        },
      },
    });

    await kakaoLogin("CODE");

    expect(saveToken).toHaveBeenCalledWith("accessToken", "ACCESS_KAKAO");
    expect(saveToken).toHaveBeenCalledWith("expiresIn", "1800");

    expect(saveToken).not.toHaveBeenCalledWith(
      "refreshToken",
      expect.anything(),
    );
  });

  it("reissueToken: refreshTokenParam이 없으면 secureStore의 refreshToken을 사용하고 토큰들을 저장한다", async () => {
    // given
    getToken.mockResolvedValueOnce("STORED_REFRESH"); // getToken("refreshToken")

    client.post.mockResolvedValueOnce({
      data: {
        success: true,
        responseDto: {
          accessToken: "NEW_ACCESS",
          refreshToken: "NEW_REFRESH",
          expiresIn: 999,
        },
      },
    });

    // when
    const res = await reissueToken(undefined);

    // then
    expect(client.post).toHaveBeenCalledWith(
      "/api/v1/auth/reissue",
      null,
      expect.objectContaining({
        params: { refreshToken: "STORED_REFRESH" },
        skipAuth: true,
      }),
    );

    expect(saveToken).toHaveBeenCalledWith("accessToken", "NEW_ACCESS");
    expect(saveToken).toHaveBeenCalledWith("refreshToken", "NEW_REFRESH");
    expect(saveToken).toHaveBeenCalledWith("expiresIn", "999");

    expect(res).toEqual({
      accessToken: "NEW_ACCESS",
      refreshToken: "NEW_REFRESH",
      expiresIn: 999,
    });
  });

  it("reissueToken: 서버가 success=false면 에러를 던진다", async () => {
    getToken.mockResolvedValueOnce("STORED_REFRESH");

    client.post.mockResolvedValueOnce({
      data: {
        success: false,
        error: { message: "토큰 재발급 실패", code: "X" },
      },
    });

    await expect(reissueToken(undefined)).rejects.toThrow("토큰 재발급 실패");
  });

  it("reissueToken: 파라미터로 refreshToken이 전달되면 저장소 값을 무시하고 전달된 값을 사용한다", async () => {
    // given
    const paramToken = "PARAM_TOKEN";

    client.post.mockResolvedValueOnce({
      data: {
        success: true,
        responseDto: {
          accessToken: "NEW_ACCESS",
          refreshToken: "NEW_REFRESH",
          expiresIn: 100,
        },
      },
    });

    // when
    await reissueToken(paramToken);

    // then
    expect(client.post).toHaveBeenCalledWith(
      "/api/v1/auth/reissue",
      null,
      expect.objectContaining({ params: { refreshToken: paramToken } }),
    );
    // secureStore의 getToken은 호출되지 않아야 함
    expect(getToken).not.toHaveBeenCalled();
    expect(saveToken).toHaveBeenCalledWith("accessToken", "NEW_ACCESS");
    expect(saveToken).toHaveBeenCalledWith("refreshToken", "NEW_REFRESH");
    expect(saveToken).toHaveBeenCalledWith("expiresIn", "100");
  });
});
