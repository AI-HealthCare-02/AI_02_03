import base64
import json
from datetime import datetime
from typing import Annotated

import boto3
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import ORJSONResponse as Response
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.models.food_logs import FoodLog
from app.models.users import User

food_router = APIRouter(prefix="/food", tags=["food"])


def _s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
        region_name=config.AWS_REGION,
    )


def _calculate_rating(calories: int, fat: int, sugar: int) -> str:
    if calories < 400 and fat < 10 and sugar < 10:
        return "훌륭함"
    elif calories < 600 and fat < 20 and sugar < 20:
        return "좋음"
    elif calories < 800 and fat < 30 and sugar < 30:
        return "보통"
    else:
        return "주의"


@food_router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food_log(
    log_id: int,
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    result = await db.execute(select(FoodLog).where(FoodLog.id == log_id, FoodLog.user_id == user.id))
    log = result.scalar_one_or_none()
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기록을 찾을 수 없습니다")
    await db.delete(log)
    await db.commit()


@food_router.get("/me", status_code=status.HTTP_200_OK)
async def get_my_food_logs(
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    result = await db.execute(
        select(FoodLog).where(FoodLog.user_id == user.id).order_by(FoodLog.analyzed_at.desc()).limit(20)
    )
    logs = result.scalars().all()
    return Response(
        [
            {
                "id": log.id,
                "food_name": log.food_name,
                "calories": log.calories,
                "fat": log.fat,
                "sugar": log.sugar,
                "liver_impact": log.liver_impact,
                "recommendation": log.recommendation,
                "rating": log.rating,
                "image_url": log.image_url,
                "analyzed_at": log.analyzed_at.isoformat(),
            }
            for log in logs
        ],
        status_code=status.HTTP_200_OK,
    )


@food_router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_food(
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    image: Annotated[UploadFile, File(...)],
) -> Response:
    if image.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="jpg, jpeg, png 파일만 업로드 가능합니다")

    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="파일 크기는 10MB 이하여야 합니다")

    ext = image.filename.rsplit(".", 1)[-1] if image.filename and "." in image.filename else "jpg"
    filename = f"{user.id}_{int(datetime.now().timestamp() * 1000)}.{ext}"
    s3_key = f"food/{filename}"
    _s3_client().put_object(
        Bucket=config.S3_BUCKET_NAME,
        Key=s3_key,
        Body=contents,
        ContentType=image.content_type,
    )
    image_url = f"https://{config.S3_BUCKET_NAME}.s3.{config.AWS_REGION}.amazonaws.com/{s3_key}"

    base64_image = base64.b64encode(contents).decode("utf-8")
    encoded_url = f"data:{image.content_type};base64,{base64_image}"

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
                            "text": """당신은 음식 영양 분석 전문가입니다. 이 사진에 있는 음식을 분석해주세요.
음식이 완전히 명확하지 않더라도 최대한 추론하여 답변하세요. 절대로 "인식 불가"로 응답하지 마세요.
칼로리와 영양소는 사진에 보이는 실제 양을 기준으로 추정하되, 일반적인 한국 식당 1인분 기준(실제 섭취량)으로 계산하세요. 절대로 100g 기준으로 계산하지 마세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
    "food_name": "음식 이름 (한국어)",
    "calories": 칼로리(정수),
    "fat": 지방(g, 정수),
    "sugar": 당류(g, 정수),
    "liver_impact": "이 음식이 지방간에 미치는 영향 한 문장 (한국어)",
    "recommendation": "이 음식을 먹은 후 건강 관련 한 줄 조언 (한국어)"
}""",
                        },
                        {"type": "image_url", "image_url": {"url": encoded_url}},
                    ],
                }
            ],
            max_tokens=500,
        )

        result_text = response.choices[0].message.content
        result_text = result_text.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(result_text)

        calories = int(result.get("calories", 0))
        fat = int(result.get("fat", 0))
        sugar = int(result.get("sugar", 0))
        rating = _calculate_rating(calories, fat, sugar)

        log = FoodLog(
            user_id=user.id,
            food_name=result.get("food_name", ""),
            calories=calories,
            fat=fat,
            sugar=sugar,
            liver_impact=result.get("liver_impact", ""),
            recommendation=result.get("recommendation", ""),
            rating=rating,
            image_url=image_url,
            analyzed_at=datetime.now(),
        )
        db.add(log)
        await db.commit()

        return Response({**result, "rating": rating, "image_url": image_url}, status_code=status.HTTP_200_OK)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="분석 결과를 파싱하는 중 오류가 발생했습니다") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"음식 분석 중 오류가 발생했습니다: {str(e)}") from e
