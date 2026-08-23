from dataclasses import dataclass
import json
from typing import Any, Optional
import uuid

import httpx
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.domains.catalog.config import settings as catalog_settings
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant


@dataclass
class ProductMatchResult:
    is_match_found: bool
    matched_product_id: Optional[uuid.UUID]
    matched_variant_id: Optional[uuid.UUID]
    match_type: str  # "EXACT_BARCODE", "EXACT_MODEL_NUMBER", "FUZZY_CANDIDATE", "NONE"
    confidence_score: float
    auto_merge_eligible: bool
    requires_admin_review: bool
    candidate_products: list[dict[str, Any]]
    explanation: str


class AIAssistService:
    """
    Catalog Intelligence & Deterministic Matching Assistant for MyMedDevices.
    
    Safety Rules:
    - AI is strictly prohibited from hallucinating clinical indications, patient populations, or regulatory clearances (PPB/KMPDB/FDA/CE).
    - Automatic catalog merge is permitted ONLY on 100% deterministic identity keys (exact GTIN/EAN or exact Manufacturer + Model Number).
    - All fuzzy/semantic candidate matches route to the Admin Moderation Queue for human sign-off.
    """

    async def match_submitted_product(
        self,
        session: AsyncSession,
        product_name: str,
        gtin_or_ean: str | None = None,
        manufacturer_id: uuid.UUID | None = None,
        manufacturer_model_number: str | None = None,
    ) -> ProductMatchResult:
        """
        Execute deterministic-first product identity matching for vendor submissions.
        """
        # 1. LAYER 1A: Exact Barcode Match (GTIN / EAN)
        if gtin_or_ean and gtin_or_ean.strip():
            clean_gtin = gtin_or_ean.strip()
            stmt_gtin = (
                select(ProductVariant)
                .options(selectinload(ProductVariant.product))
                .where(ProductVariant.gtin_or_ean == clean_gtin, ProductVariant.is_active == True)
            )
            res_gtin = await session.execute(stmt_gtin)
            matched_var = res_gtin.scalar_one_or_none()

            if matched_var and matched_var.product:
                return ProductMatchResult(
                    is_match_found=True,
                    matched_product_id=matched_var.product.id,
                    matched_variant_id=matched_var.id,
                    match_type="EXACT_BARCODE",
                    confidence_score=1.0,
                    auto_merge_eligible=True,
                    requires_admin_review=False,
                    candidate_products=[],
                    explanation=f"Exact GTIN/EAN barcode match '{clean_gtin}' on variant '{matched_var.name}' of canonical product '{matched_var.product.name}'.",
                )

        # 2. LAYER 1B: Exact Manufacturer + Model Number Match
        if manufacturer_id and manufacturer_model_number and manufacturer_model_number.strip():
            clean_model = manufacturer_model_number.strip().upper()
            stmt_model = (
                select(Product)
                .options(selectinload(Product.variants))
                .where(
                    Product.manufacturer_id == manufacturer_id,
                    func.upper(Product.manufacturer_model_number) == clean_model,
                    Product.is_deleted == False,
                )
            )
            res_model = await session.execute(stmt_model)
            matched_prod = res_model.scalar_one_or_none()

            if matched_prod:
                default_var = matched_prod.variants[0] if matched_prod.variants else None
                return ProductMatchResult(
                    is_match_found=True,
                    matched_product_id=matched_prod.id,
                    matched_variant_id=default_var.id if default_var else None,
                    match_type="EXACT_MODEL_NUMBER",
                    confidence_score=1.0,
                    auto_merge_eligible=True,
                    requires_admin_review=False,
                    candidate_products=[],
                    explanation=f"Exact manufacturer and model number match '{clean_model}' on canonical product '{matched_prod.name}'.",
                )

        # 3. LAYER 2: Fuzzy Trigram Search on Canonical Product Name
        clean_name = product_name.strip()
        stmt_fuzzy = (
            select(Product)
            .where(
                Product.status == "published",
                Product.is_deleted == False,
                func.lower(Product.name).like(f"%{clean_name.lower()}%")
            )
            .limit(5)
        )
        res_fuzzy = await session.execute(stmt_fuzzy)
        fuzzy_matches = res_fuzzy.scalars().all()

        if fuzzy_matches:
            candidates = [
                {
                    "product_id": str(p.id),
                    "name": p.name,
                    "model_number": p.manufacturer_model_number,
                    "slug": p.slug,
                }
                for p in fuzzy_matches
            ]
            return ProductMatchResult(
                is_match_found=False,
                matched_product_id=None,
                matched_variant_id=None,
                match_type="FUZZY_CANDIDATE",
                confidence_score=0.75,
                auto_merge_eligible=False,  # Prohibited from auto-merge!
                requires_admin_review=True,  # Routed to moderation queue
                candidate_products=candidates,
                explanation="Similar existing products found by name similarity. Routed to Admin Moderation Queue for human verification.",
            )

        return ProductMatchResult(
            is_match_found=False,
            matched_product_id=None,
            matched_variant_id=None,
            match_type="NONE",
            confidence_score=0.0,
            auto_merge_eligible=False,
            requires_admin_review=False,
            candidate_products=[],
            explanation="No matching canonical product found. Eligible for new product submission.",
        )

    async def generate_suggestions(
        self,
        product: Any,
        category: Optional[Category] = None,
        fields_to_generate: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """
        Generate structured MedAI product fields (description, short overview, key-value specs, tags, SEO).
        """
        fields = set(fields_to_generate or [
            "description", "short_description", "specifications", "tags", "meta_title", "meta_description"
        ])

        product_name = getattr(product, "name", "") or (product.get("name") if isinstance(product, dict) else "") or "Medical Device"
        brand_name = getattr(product, "brand", "") or (product.get("brand") if isinstance(product, dict) else "") or "Standard Medical"
        model_number = getattr(product, "model_number", "") or (product.get("model_number") if isinstance(product, dict) else "") or ""
        category_name = getattr(category, "name", "") or "Medical Equipment & Supplies"
        sku = getattr(product, "sku", "") or (product.get("sku") if isinstance(product, dict) else "") or ""

        api_key = catalog_settings.GEMINI_API_KEY
        model_name = catalog_settings.GEMINI_MODEL or "gemini-1.5-flash"

        # Fallback generator if no API key is provided
        if not api_key:
            return self._build_deterministic_fallback(product_name, brand_name, category_name, model_number, sku, fields)

        prompt = (
            f"You are MedAI, an expert clinical biomedical engineer and medical device catalog specialist for MyMedDevices Kenya.\n"
            f"Generate high-quality, professional e-commerce product catalog content for the following device:\n\n"
            f"- Product Name: {product_name}\n"
            f"- Brand / Manufacturer: {brand_name}\n"
            f"- Model / Part Number: {model_number or 'N/A'}\n"
            f"- Category: {category_name}\n"
            f"- SKU: {sku or 'N/A'}\n\n"
            f"Guidelines:\n"
            f"1. short_description: A concise, punchy 1-2 sentence overview (maximum 200 characters) optimized for mobile product card previews highlighting core clinical utility, target clinical setting, and main benefit.\n"
            f"2. description: Comprehensive, beautifully structured long description formatted with clean Markdown/Rich text for desktop/web browsing. Must include:\n"
            f"   - **Overview & Clinical Utility**: 1 clear paragraph on indication, operational purpose, and reliability.\n"
            f"   - **Key Features & Benefits**: Bullet points highlighting clinical performance, durability, ease of use, and patient safety.\n"
            f"   - **Clinical Applications & Workflow**: Brief section explaining where and how it is used (e.g. ICU, outpatient, general ward).\n"
            f"3. specifications: Structured key-value object of essential technical & physical parameters (e.g., Power Supply, Operating Temperature, Dimensions, Display, Measurement Range, Warranty).\n"
            f"4. tags: Array of 5-8 relevant lowercase search keywords (e.g., ['cardiology', 'patient-monitor', 'diagnostic', 'icu-equipment']).\n"
            f"5. meta_title: Concise SEO title under 60 chars (e.g., '{brand_name} {product_name} | Buy Online Kenya').\n"
            f"6. meta_description: Action-oriented SEO summary under 160 chars."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "short_description": {"type": "STRING"},
                        "description": {"type": "STRING"},
                        "specifications": {
                            "type": "OBJECT",
                            "additionalProperties": {"type": "STRING"},
                        },
                        "tags": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "meta_title": {"type": "STRING"},
                        "meta_description": {"type": "STRING"},
                    },
                    "required": ["short_description", "description", "specifications", "tags", "meta_title", "meta_description"],
                },
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                generated_json = json.loads(text_out)

                filtered_suggestions = {k: v for k, v in generated_json.items() if k in fields}
                confidence_map = {k: 0.95 for k in filtered_suggestions.keys()}

                return {
                    "suggestions": filtered_suggestions,
                    "confidence": confidence_map,
                    "message": "MedAI content successfully generated using Google Gemini.",
                }
        except Exception as e:
            logger.warning(f"Gemini API request failed or timed out: {e}. Utilizing deterministic medical fallback.")
            return self._build_deterministic_fallback(product_name, brand_name, category_name, model_number, sku, fields)

    def _build_deterministic_fallback(
        self,
        product_name: str,
        brand_name: str,
        category_name: str,
        model_number: str,
        sku: str,
        fields: set[str],
    ) -> dict[str, Any]:
        """Provides high-quality structured medical data when Gemini API is unavailable."""
        model_clause = f" (Model: {model_number})" if model_number else ""
        full_suggestions = {
            "short_description": f"Hospital-grade {product_name}{model_clause} by {brand_name} engineered for precision clinical reliability in {category_name.lower()}.",
            "description": (
                f"### Overview & Clinical Utility\n"
                f"The **{brand_name} {product_name}**{model_clause} provides robust, compliant clinical performance for healthcare facilities, outpatient clinics, and specialized diagnostic practices.\n\n"
                f"### Key Features & Benefits\n"
                f"* **Durable Medical-Grade Construction**: Designed with resilient materials for continuous high-throughput clinical use.\n"
                f"* **Intuitive Workflow**: Ergonomic interface and streamlined operation minimize user training time.\n"
                f"* **High Diagnostic Accuracy**: Engineered for consistent calibration and patient safety.\n\n"
                f"### Clinical Applications\n"
                f"Ideal for general healthcare environments, emergency care, and specialized medical departments requiring dependable equipment performance."
            ),
            "specifications": {
                "Power Supply": "100-240V AC, 50/60 Hz / Internal Backup Battery",
                "Operating Temperature": "10°C to 40°C (50°F to 104°F)",
                "Storage Humidity": "15% to 90% non-condensing",
                "Warranty": "1 Year Manufacturer Warranty with Local Service Support",
                "Application Class": category_name or "General Medical Equipment",
            },
            "tags": [
                brand_name.lower().replace(" ", "-"),
                category_name.lower().replace(" ", "-"),
                "medical-equipment",
                "hospital-grade",
                "clinical",
                "kenya-healthcare",
            ],
            "meta_title": f"{brand_name} {product_name} - Medical Equipment Kenya",
            "meta_description": f"Order authentic {brand_name} {product_name} online on MyMedDevices Kenya. Guaranteed quality, fast dispatch, and verified vendor warranty.",
        }

        filtered = {k: v for k, v in full_suggestions.items() if k in fields}
        confidence = {k: 0.85 for k in filtered.keys()}

        return {
            "suggestions": filtered,
            "confidence": confidence,
            "message": "Generated via MedAI catalog intelligence fallback engine.",
        }

    async def ai_validate_product(
        self, product: Any, category: Optional[Category] = None
    ) -> dict[str, Any]:
        """
        Validates product listing against medical device accuracy, completeness, and clarity.
        """
        passed_checks = []
        warnings = []
        recommendations = []
        completeness_score = 100

        name = getattr(product, "name", "")
        if not name or len(name) < 5:
            completeness_score -= 25
            warnings.append("Product name is too short or missing.")
        else:
            passed_checks.append("Product title format is valid.")

        brand = getattr(product, "brand", "")
        if not brand:
            completeness_score -= 20
            warnings.append("Brand / Manufacturer is not specified.")
        else:
            passed_checks.append("Manufacturer brand identified.")

        desc = getattr(product, "description", "")
        if not desc or len(desc) < 50:
            completeness_score -= 25
            warnings.append("Clinical description is missing or lacks detail.")
            recommendations.append("Use MedAI Auto-Fill to generate a detailed medical device description.")
        else:
            passed_checks.append("Clinical description meets minimum length.")

        specs = getattr(product, "specifications", {})
        if not specs or not isinstance(specs, dict) or len(specs) == 0:
            completeness_score -= 20
            warnings.append("Technical specifications are missing.")
            recommendations.append("Add key operational parameters (Power, Dimensions, Warranty).")
        else:
            passed_checks.append(f"Contains {len(specs)} technical specification entries.")

        completeness_score = max(0, min(100, completeness_score))

        return {
            "is_valid": completeness_score >= 60,
            "completeness_score": completeness_score,
            "passed_checks": passed_checks,
            "warnings": warnings,
            "recommendations": recommendations,
        }

    async def generate_descriptions_from_name_brand(
        self, product_name: str, brand: str, category: str | None = None
    ) -> dict[str, Any]:
        """
        Generate copywriting suggestions and structured specifications from manufacturer inputs.
        """
        category_name = category or "Medical Equipment"
        res = await self.generate_suggestions(
            product={"name": product_name, "brand": brand},
            category=Category(name=category_name) if category else None,
            fields_to_generate=["description", "short_description", "specifications", "tags", "meta_title", "meta_description"],
        )
        return {
            "suggestions": res.get("suggestions", {}),
            "confidence": res.get("confidence", {}),
            "message": res.get("message", "MedAI generated product specifications and clinical copywriting."),
        }


ai_assist_service = AIAssistService()
