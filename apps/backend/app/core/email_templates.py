from typing import Optional

from app.core.config import settings

BRAND_PRIMARY = "#EF6C24"
BRAND_PRIMARY_LIGHT = "#fbdccb"
BRAND_DARK = "#053D7A"
BRAND_DARK_LIGHT = "#d6e4f0"


def _base_html(
    body_content: str,
    title: str,
    preheader: str = "",
    logo_url: Optional[str] = None,
) -> str:
    logo = logo_url or settings.EMAIL_LOGO_URL

    if not logo:
        header_html = """          <tr>
            <td style="text-align:center;padding:32px 32px 12px;font-size:20px;font-weight:700;color:#053D7A;letter-spacing:-0.02em;">
              MyMedDevices
            </td>
          </tr>"""
    else:
        header_html = f"""          <tr>
            <td class="header-cell">
              <img src="{logo}" alt="MyMedDevices" width="180" height="60" style="max-width:180px;height:auto;border:0;outline:none;display:block;margin:0 auto;">
            </td>
          </tr>"""

    return f"""<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>{title}</title>
  <style>
    .preheader {{
      display: none;
      font-size: 1px;
      color: #f4f6f8;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
      mso-hide: all;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .email-table {{
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6f8;
    }}
    .email-container {{
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #e5e7eb;
    }}
    .header-cell {{
      padding: 28px 32px 12px;
      text-align: center;
    }}
    .accent-bar {{
      height: 4px;
      background-color: {BRAND_PRIMARY};
    }}
    .content-cell {{
      padding: 36px 32px 24px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 700;
      color: {BRAND_DARK};
      margin: 0 0 12px;
      line-height: 1.3;
    }}
    p {{
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 20px;
    }}
    .otp-container {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 28px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-code {{
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 34px;
      font-weight: 700;
      letter-spacing: 8px;
      color: {BRAND_PRIMARY};
      margin: 0;
      display: inline-block;
      user-select: all;
    }}
    .otp-expiry {{
      font-size: 14px;
      color: #64748b;
      margin: 10px 0 0;
    }}
    .button-cell {{
      text-align: center;
      padding: 8px 0 24px;
    }}
    .button {{
      display: inline-block;
      padding: 14px 36px;
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      background-color: {BRAND_PRIMARY};
      border-radius: 6px;
      text-decoration: none;
      line-height: 1.4;
      mso-hide: none;
    }}
    .button:hover {{
      background-color: #d4540f;
    }}
    .divider {{
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }}
    .footer-cell {{
      padding: 24px 32px;
      background-color: #f8fafc;
      border-top: 1px solid #e5e7eb;
    }}
    .footer-text {{
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0 0 4px;
    }}
    .footer-text a {{
      color: {BRAND_DARK};
      text-decoration: underline;
    }}
    @media (prefers-color-scheme: dark) {{
      body, .email-table {{
        background-color: #0f172a;
      }}
      .email-container {{
        background: #1e293b;
        border-color: #334155;
      }}
      h1 {{
        color: #f1f5f9;
      }}
      p {{
        color: #cbd5e1;
      }}
      .otp-container {{
        background: #0f172a;
        border-color: #334155;
      }}
      .otp-expiry {{
        color: #94a3b8;
      }}
      .footer-cell {{
        background-color: #0f172a;
        border-top-color: #334155;
      }}
      .footer-text {{
        color: #64748b;
      }}
    }}
    @media only screen and (max-width: 480px) {{
      .email-container {{
        border-radius: 0;
        border-left: none;
        border-right: none;
      }}
      .content-cell {{
        padding: 28px 20px 20px;
      }}
      .header-cell {{
        padding: 24px 20px 8px;
      }}
      img {{
        max-width: 150px;
      }}
      .footer-cell {{
        padding: 20px;
      }}
      h1 {{
        font-size: 20px;
      }}
      .otp-code {{
        font-size: 28px;
        letter-spacing: 6px;
      }}
      .button {{
        display: block;
        padding: 14px 20px;
      }}
    }}
  </style>
</head>
<body lang="en" dir="ltr">
  <div lang="en" dir="ltr" class="preheader">{preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-table">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container">
          {header_html}
          <tr>
            <td class="accent-bar"></td>
          </tr>
          {body_content}
          <tr>
            <td class="footer-cell">
              <p class="footer-text">
                This is an automated message from MyMedDevices.<br>
                If you need help, contact <a href="mailto:support@mymeddevices.com">support@mymeddevices.com</a>
              </p>
              <p class="footer-text" style="margin-top:8px;">
                &copy; 2026 MyMedDevices. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def otp_html(code: str, title: str, lead_text: str, footer_note: str, expiry_minutes: int) -> str:
    preheader = f"Your verification code: {code} — expires in {expiry_minutes} minutes"
    body = f"""
          <tr>
            <td class="content-cell">
              <h1>{title}</h1>
              <p>{lead_text}</p>

              <div class="otp-container">
                <div class="otp-code">{code}</div>
                <p class="otp-expiry">Expires in {expiry_minutes} minutes</p>
              </div>

              <p style="font-size:14px;color:#64748b;margin:0;">
                {footer_note}
              </p>
            </td>
          </tr>
"""
    return _base_html(body, title, preheader=preheader)


def vendor_notification_html(title: str, message: str, detail: Optional[str] = None) -> str:
    body = f"""
          <tr>
            <td class="content-cell">
              <h1>{title}</h1>
              <p>{message}</p>
"""
    if detail:
        body += f"""              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin:16px 0;">
                <p style="font-size:14px;color:#991b1b;margin:0;">{detail}</p>
              </div>
"""
    body += """            </td>
          </tr>
"""
    return _base_html(body, title)
