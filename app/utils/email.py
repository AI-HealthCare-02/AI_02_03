import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core import config

logger = logging.getLogger(__name__)


async def send_temp_password_email(to: str, temp_password: str) -> None:
    if not config.SMTP_USER or not config.SMTP_PASSWORD:
        logger.warning("SMTP 설정이 없어 이메일 발송을 건너뜁니다. to=%s", to)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[간건강 케어] 임시 비밀번호 안내"
    msg["From"] = config.SMTP_USER
    msg["To"] = to
    msg.attach(
        MIMEText(
            f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #059669;">간건강 케어 임시 비밀번호 안내</h2>
      <p>안녕하세요. 임시 비밀번호가 발급되었습니다.</p>
      <div style="background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 8px;
                  padding: 16px; text-align: center; margin: 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">임시 비밀번호</p>
        <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold;
                  color: #065f46; letter-spacing: 4px;">{temp_password}</p>
      </div>
      <p style="color: #ef4444; font-size: 13px;">⚠ 이 비밀번호는 <strong>10분 후 만료</strong>됩니다. 빠르게 로그인해주세요.</p>
      <p style="color: #ef4444; font-size: 13px;">⚠ 로그인 후 반드시 비밀번호를 변경해주세요.</p>
    </div>
    """,
            "html",
            "utf-8",
        )
    )

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        username=config.SMTP_USER,
        password=config.SMTP_PASSWORD,
        start_tls=True,
    )
