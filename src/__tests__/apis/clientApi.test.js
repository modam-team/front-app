import { client, setOnAuthFail } from "@apis/clientApi";
import * as secureStore from "@utils/secureStore";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("@utils/secureStore", () => ({
  getToken: jest.fn(),
  saveToken: jest.fn(),
  deleteToken: jest.fn(),
}));

describe("clientApi - invalid token 처리", () => {
  let mock;
  let authFailHandler;

  beforeEach(() => {
    mock = new MockAdapter(client);
    authFailHandler = jest.fn();

    setOnAuthFail(authFailHandler);

    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  it("invalid token(4032) 응답 시 로그아웃 핸들러가 호출된다", async () => {
    // accessToken이 있다고 가정
    secureStore.getToken.mockResolvedValue("fake-access-token");

    // 서버가 invalid token 에러를 내려줌
    mock.onGet("/test").reply(403, {
      error: {
        code: "4032",
        message: "TOKEN_MALFORMED",
      },
    });

    // 요청 실행
    await expect(client.get("/test")).rejects.toBeDefined();

    expect(authFailHandler).toHaveBeenCalledTimes(1); // 로그아웃 유도 로직이 실제로 실행 됐는지 확인
    expect(secureStore.deleteToken).toHaveBeenCalled();
  });
});
