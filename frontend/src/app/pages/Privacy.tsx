export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">개인정보 처리방침</h1>

      <p>
        본 서비스는 다음과 같은 개인정보를 수집합니다.
      </p>

      <ul className="list-disc pl-6">
        <li>이메일</li>
        <li>닉네임</li>
        <li>건강 설문 정보</li>
      </ul>

      <p>
        수집된 정보는 개인 맞춤 건강 관리 기능 제공을 위해 사용됩니다.
      </p>

      <p>
        개인정보는 서비스 이용 기간 동안 보관됩니다.
      </p>
    </div>
  );
}