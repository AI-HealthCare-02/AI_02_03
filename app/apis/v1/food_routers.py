import base64
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import ORJSONResponse as Response
from openai import AsyncOpenAI

from app.core import config
from app.dependencies.security import get_request_user
from app.models.users import User

food_router = APIRouter(prefix="/food", tags=["food"])


@food_router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_food(
    user: Annotated[User, Depends(get_request_user)],
    image: Annotated[UploadFile, File(...)],
) -> Response:
    # 파일 형식 확인
    if image.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="jpg, jpeg, png 파일만 업로드 가능합니다")

    # 파일 크기 확인 (10MB)
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="파일 크기는 10MB 이하여야 합니다")

    # base64 인코딩
    base64_image = base64.b64encode(contents).decode("utf-8")
    image_url = f"data:{image.content_type};base64,{base64_image}"

    # OpenAI API 호출
    client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """이 음식 사진을 분석해주세요. 반드시 아래 JSON 형식으로만 응답해주세요.
{
    "food_name": "음식 이름",
    "calories": 칼로리(숫자),
    "fat": 지방(g, 숫자),
    "sugar": 당류(g, 숫자),
    "liver_impact": "지방간에 미치는 영향 한 문장",
    "recommendation": "건강 관련 한 줄 조언"
}
음식을 인식할 수 없으면 food_name을 "인식 불가"로 응답해주세요.""",
                        },
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            max_tokens=500,
        )

        import json

        result_text = response.choices[0].message.content
        result_text = result_text.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(result_text)

        return Response(result, status_code=status.HTTP_200_OK)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"음식 분석 중 오류가 발생했습니다: {str(e)}",
        ) from e
