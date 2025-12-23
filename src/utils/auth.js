import { client } from "@apis/clientApi";
import { deleteToken } from "@utils/secureStore";

export async function clearAuth() {
  // SecureStore에 저장된 인증 정보 전부 삭제
  await Promise.all([
    deleteToken("accessToken"),
    deleteToken("refreshToken"),
    deleteToken("expiresIn"),
  ]);

  // axios에 남아 있을 수 있는 Authorization 헤더 제거
  delete client.defaults.headers.common.Authorization;
}
