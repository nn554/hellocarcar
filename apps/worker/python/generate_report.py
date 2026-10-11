from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def register_fonts() -> tuple[str, str]:
    cjk_candidates = [
        os.getenv("REPORT_FONT_CJK"),
        r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    arabic_candidates = [
        os.getenv("REPORT_FONT_ARABIC"),
        r"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]

    def choose(candidates: list[str | None], name: str) -> str:
        for candidate in candidates:
            if candidate and Path(candidate).exists():
                pdfmetrics.registerFont(TTFont(name, candidate))
                return name
        raise RuntimeError(f"No usable font found for {name}")

    return choose(cjk_candidates, "HCCCJK"), choose(arabic_candidates, "HCCArabic")


def rtl(value: Any) -> str:
    return get_display(arabic_reshaper.reshape(str(value)))


def format_value(value: Any, is_arabic: bool) -> str:
    text = "-" if value is None or value == "" else str(value)
    return rtl(text) if is_arabic else text


def build_report(payload: dict[str, Any], output_path: Path) -> None:
    cjk_font, arabic_font = register_fonts()
    locale = str(payload.get("locale", "en"))
    is_arabic = locale.startswith("ar")
    font = arabic_font if is_arabic else cjk_font
    alignment = TA_RIGHT if is_arabic else TA_LEFT
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("HccTitle", parent=styles["Title"], fontName=font, fontSize=22, leading=30, textColor=colors.HexColor("#18211D"), alignment=alignment, spaceAfter=8 * mm)
    heading_style = ParagraphStyle("HccHeading", parent=styles["Heading2"], fontName=font, fontSize=13, leading=18, textColor=colors.HexColor("#0E695A"), alignment=alignment, spaceBefore=5 * mm, spaceAfter=3 * mm)
    body_style = ParagraphStyle("HccBody", parent=styles["BodyText"], fontName=font, fontSize=9.5, leading=15, textColor=colors.HexColor("#27322D"), alignment=alignment)
    small_style = ParagraphStyle("HccSmall", parent=body_style, fontSize=7.5, leading=11, textColor=colors.HexColor("#5E6B65"))

    labels = {
        "en": {"summary": "Executive summary", "company": "Supplier assessment", "risk": "Verified risk points", "dates": "Data dates", "disclaimer": "Important notice", "score": "Score", "complete": "Data completeness", "recommendation": "Recommendation", "query": "Query date", "updated": "Data updated", "valid": "Valid until"},
        "zh": {"summary": "执行摘要", "company": "供应商评估", "risk": "已验证风险点", "dates": "数据日期", "disclaimer": "重要说明", "score": "评分", "complete": "数据完整度", "recommendation": "推荐结论", "query": "查询日期", "updated": "数据更新时间", "valid": "有效期至"},
        "ar": {"summary": "الملخص التنفيذي", "company": "تقييم المورد", "risk": "نقاط المخاطر المؤكدة", "dates": "تواريخ البيانات", "disclaimer": "تنبيه مهم", "score": "النتيجة", "complete": "اكتمال البيانات", "recommendation": "التوصية", "query": "تاريخ الاستعلام", "updated": "آخر تحديث للبيانات", "valid": "صالح لغاية"},
    }
    copy = labels["ar" if is_arabic else "zh" if locale.startswith("zh") else "en"]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(str(output_path), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm, topMargin=24 * mm, bottomMargin=20 * mm, title=str(payload.get("title", "HelloCarCar report")), author="HelloCarCar")

    def page(canvas, doc):
        canvas.saveState()
        width, height = A4
        canvas.setFillColor(colors.HexColor("#0E695A"))
        canvas.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)
        canvas.setFont(font, 7)
        canvas.setFillColor(colors.HexColor("#66736D"))
        canvas.drawString(20 * mm, 10 * mm, f"HelloCarCar | {payload.get('reportNumber', '-')}")
        canvas.drawRightString(width - 20 * mm, 10 * mm, str(doc.page))
        canvas.setFillAlpha(0.012)
        canvas.setFont(font, 24)
        canvas.setFillColor(colors.HexColor("#0E695A"))
        canvas.translate(width / 2, 70 * mm)
        canvas.rotate(20)
        canvas.drawCentredString(0, 0, "HELLOCARCAR")
        canvas.restoreState()

    company = payload.get("company") or {}
    story = [
        Paragraph(format_value(payload.get("title", "HelloCarCar supplier report"), is_arabic), title_style),
        Paragraph(format_value(f"{payload.get('reportNumber', '-')} | {payload.get('generatedAt', '-')}", is_arabic), small_style),
        Paragraph(format_value(copy["summary"], is_arabic), heading_style),
        Paragraph(format_value(payload.get("summary", ""), is_arabic), body_style),
        Paragraph(format_value(copy["company"], is_arabic), heading_style),
    ]
    rows = [
        [format_value(copy["recommendation"], is_arabic), format_value(company.get("recommendation"), is_arabic)],
        [format_value(copy["score"], is_arabic), format_value(company.get("score"), is_arabic)],
        [format_value(copy["complete"], is_arabic), format_value(f"{company.get('completeness', 0)}%", is_arabic)],
    ]
    if is_arabic:
        rows = [[value, label] for label, value in rows]
    table = Table(rows, colWidths=[55 * mm, 105 * mm], hAlign="RIGHT" if is_arabic else "LEFT")
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#52615A")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#18211D")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F6F4")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7DFDA")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7DFDA")),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT" if is_arabic else "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([table, Paragraph(format_value(copy["risk"], is_arabic), heading_style)])
    risks = company.get("risks") or []
    story.extend(Paragraph(format_value(f"- {risk}", is_arabic), body_style) for risk in risks)
    if not risks:
        story.append(Paragraph(format_value("No verified risk points in the report evidence snapshot.", is_arabic), body_style))
    story.extend([
        Spacer(1, 4 * mm),
        KeepTogether([
            Paragraph(format_value(copy["dates"], is_arabic), heading_style),
            Paragraph(format_value(f"{copy['query']}: {payload.get('queryDate', '-')} | {copy['updated']}: {payload.get('dataUpdatedAt', '-')}", is_arabic), body_style),
        ]),
        Paragraph(format_value(copy["disclaimer"], is_arabic), heading_style),
        Paragraph(format_value(payload.get("disclaimer", "This report is a decision-support document based on the verified evidence snapshot available at generation time. It is not a guarantee of performance or legal advice."), is_arabic), body_style),
        Spacer(1, 10 * mm),
        Paragraph(format_value(f"{copy['valid']}: {payload.get('validUntil', '-')}", is_arabic), small_style),
    ])
    document.build(story, onFirstPage=page, onLaterPages=page)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: generate_report.py INPUT_JSON OUTPUT_PDF")
    with open(sys.argv[1], "r", encoding="utf-8") as stream:
        payload = json.load(stream)
    build_report(payload, Path(sys.argv[2]))


if __name__ == "__main__":
    main()
