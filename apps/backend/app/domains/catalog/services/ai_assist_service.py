import json
import httpx
from typing import Optional, Dict, List, Any
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.category import Category
from app.core.logging import logger
from app.domains.catalog.config import settings as catalog_settings


class AIAssistService:
    """
    AI-powered product assistant for auto-filling and validating product data.
    Integrated with Google Gemini API using structured JSON schema output mode.
    """

    async def generate_suggestions(
        self,
        product: Product,
        category: Optional[Category],
        fields_to_generate: List[str]
    ) -> Dict[str, Any]:
        """
        Generate AI suggestions for missing/incomplete product fields.

        Args:
            product: The product to generate suggestions for
            category: The product's category (for context)
            fields_to_generate: Which fields to generate

        Returns:
            Dict with 'suggestions' and 'confidence' dicts
        """
        api_key = catalog_settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY not configured. Falling back to stub suggestions.")
            return await self._generate_stub_suggestions(product, category, fields_to_generate)

        category_name = category.name if category else "Medical Device"
        model_name = catalog_settings.GEMINI_MODEL or "gemini-1.5-pro"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        # Build prompt instructions based on what fields were requested
        prompt = (
            f"Please generate the following fields: {', '.join(fields_to_generate)} for a medical device product.\n"
            f"Product Name: {product.name}\n"
            f"Category: {category_name}\n"
        )
        if product.brand:
            prompt += f"Brand: {product.brand}\n"
        if product.manufacturer:
            prompt += f"Manufacturer: {product.manufacturer}\n"
        if product.model_number:
            prompt += f"Model Number: {product.model_number}\n"

        system_instruction = (
            "You are an expert AI catalog assistant for MyMedDevices, a medical device e-commerce marketplace. "
            "Your goal is to generate professional, highly accurate, and compliant product details based on a product name and category. "
            "The data you generate must use correct medical device terminology, professional tone, and mention relevant specs. "
            "Enforce safety, regulatory, and quality classifications where applicable. "
            "Ensure descriptions are comprehensive, covering clinical/intended use and patient safety (at least 50 characters). "
            "Ensure specifications are structured key-value pairs representing material, power source, certifications (CE/FDA/ISO/PPB), and dimensions."
        )

        # Build JSON response schema for Gemini Structured Output
        properties = {}
        if "description" in fields_to_generate:
            properties["description"] = {"type": "STRING"}
        if "short_description" in fields_to_generate:
            properties["short_description"] = {"type": "STRING"}
        if "specifications" in fields_to_generate:
            properties["specifications"] = {
                "type": "OBJECT",
                "additionalProperties": {"type": "STRING"}
            }
        if "tags" in fields_to_generate:
            properties["tags"] = {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            }
        if "meta_title" in fields_to_generate:
            properties["meta_title"] = {"type": "STRING"}
        if "meta_description" in fields_to_generate:
            properties["meta_description"] = {"type": "STRING"}

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {"parts": [{"text": prompt}]}
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": properties,
                    "required": fields_to_generate
                }
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Parse output
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                suggestions = json.loads(text_out)
                
                # Setup default confidence scores
                confidence = {field: 0.9 for field in fields_to_generate if field in suggestions}
                
                logger.info(f"AI assist successfully generated fields for product {product.id} using Gemini API")
                return {
                    "suggestions": suggestions,
                    "confidence": confidence
                }

        except Exception as e:
            logger.error(f"Failed to generate suggestions using Gemini API: {str(e)}. Falling back to stub.")
            return await self._generate_stub_suggestions(product, category, fields_to_generate)

    async def _generate_stub_suggestions(
        self,
        product: Product,
        category: Optional[Category],
        fields_to_generate: List[str]
    ) -> Dict[str, Any]:
        """Fallback template-based suggestions if API call fails or key is missing."""
        suggestions = {}
        confidence = {}
        category_name = category.name if category else "Medical Device"

        for field in fields_to_generate:
            if field == "description" and not product.description:
                suggestions["description"] = (
                    f"{product.name} is a high-quality {category_name.lower()} "
                    f"designed for medical professionals. "
                    f"This product meets rigorous quality standards and is suitable "
                    f"for clinical and healthcare settings. "
                    f"Please update this AI-generated description with specific details "
                    f"about features, specifications, and intended use."
                )
                confidence["description"] = 0.3

            elif field == "short_description" and not product.short_description:
                suggestions["short_description"] = (
                    f"Professional-grade {category_name.lower()} for healthcare facilities."
                )
                confidence["short_description"] = 0.3

            elif field == "specifications" and not product.specifications:
                suggestions["specifications"] = {
                    "Material": "Please specify",
                    "Dimensions": "Please specify",
                    "Weight": "Please specify",
                    "Power Source": "Please specify (if applicable)",
                    "Sterilization": "Please specify method"
                }
                confidence["specifications"] = 0.2

            elif field == "tags" and not product.tags:
                tags = ["medical", "healthcare"]
                if category:
                    tags.append(category.slug)
                if product.brand:
                    tags.append(product.brand.lower())
                suggestions["tags"] = tags
                confidence["tags"] = 0.5

            elif field == "meta_title" and not product.meta_title:
                brand_part = f" | {product.brand}" if product.brand else ""
                suggestions["meta_title"] = f"{product.name}{brand_part} - MyMedDevices"
                confidence["meta_title"] = 0.6

            elif field == "meta_description" and not product.meta_description:
                suggestions["meta_description"] = (
                    f"Shop {product.name} - professional {category_name.lower()} "
                    f"available at MyMedDevices. Quality medical equipment with warranty."
                )
                confidence["meta_description"] = 0.5

        return {
            "suggestions": suggestions,
            "confidence": confidence
        }

    async def validate_product(self, product: Product) -> List[Dict[str, str]]:
        """
        Validate product data for common issues.

        Returns:
            List of issues found: [{"field": "...", "severity": "warning|error", "message": "..."}]
        """
        issues = []

        # Price validation
        # Check base_price or price
        actual_price = product.base_price or product.price
        if actual_price and actual_price <= 0:
            issues.append({
                "field": "price",
                "severity": "error",
                "message": "Price must be greater than zero"
            })

        if product.compare_at_price and actual_price:
            if product.compare_at_price <= actual_price:
                issues.append({
                    "field": "compare_at_price",
                    "severity": "warning",
                    "message": "Compare-at price should be higher than the selling price"
                })

        # Description quality
        if product.description and len(product.description) < 50:
            issues.append({
                "field": "description",
                "severity": "warning",
                "message": "Description is too short. Aim for at least 50 characters for verification."
            })

        # Medical device specifics
        if not product.brand and not product.manufacturer:
            issues.append({
                "field": "brand",
                "severity": "warning",
                "message": "Adding brand or manufacturer info improves buyer trust for medical devices"
            })

        if not product.certifications and not product.ce_marking_or_fda_clearance:
            issues.append({
                "field": "certifications",
                "severity": "warning",
                "message": "Medical devices should include certification or CE/FDA clearance details"
            })

        if not product.kmpdb_registration_number:
            issues.append({
                "field": "kmpdb_registration_number",
                "severity": "warning",
                "message": "KMPDB registration number is highly recommended for medical device classification"
            })

        if not product.ppb_classification:
            issues.append({
                "field": "ppb_classification",
                "severity": "warning",
                "message": "PPB classification (Class A/B/C/D) is highly recommended for Pharmacy & Poisons Board compliance"
            })

        logger.info(f"Product validation found {len(issues)} issues for product {product.id}")
        return issues
