import json
from typing import Any

import httpx

from app.core.logging import logger
from app.domains.catalog.config import settings as catalog_settings
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product


class AIAssistService:
    """
    AI-powered product assistant for auto-filling and validating product data.
    Integrated with Google Gemini API using structured JSON schema output mode.
    """

    async def generate_descriptions_from_name_brand(
        self, product_name: str, brand: str, category: str | None = None
    ) -> dict[str, Any]:
        """
        Generate AI descriptions from product name and brand (before product creation).

        Args:
            product_name: The product name
            brand: The brand name
            category: Optional category name for context

        Returns:
            Dict with 'suggestions' containing description and short_description
        """
        api_key = catalog_settings.GEMINI_API_KEY
        category_name = category or "Medical Device"
        model_name = catalog_settings.GEMINI_MODEL or "gemini-1.5-pro"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        if not api_key:
            logger.warning("GEMINI_API_KEY not configured. Falling back to stub descriptions.")
            return await self._generate_stub_descriptions(product_name, brand, category_name)

        prompt = (
            f"Please generate a product description and short description for a medical device product.\n"
            f"Product Name: {product_name}\n"
            f"Brand: {brand}\n"
            f"Category: {category_name}\n"
        )

        system_instruction = (
            "You are an expert AI catalog assistant for MyMedDevices, a medical device e-commerce marketplace in Kenya. "
            "Your goal is to generate professional, highly accurate, and compliant product details based on a product name and brand. "
            "You specialize in medical device taxonomy, clinical terminology, and regulatory compliance for the African healthcare market.\n\n"
            "KEY REQUIREMENTS:\n"
            "1. Use proper medical device nomenclature and clinical terminology\n"
            "2. Mention relevant clinical applications, intended use, and patient populations\n"
            "3. Include technical specifications relevant to the device category (imaging parameters, sterilization, power requirements, etc.)\n"
            "4. Reference appropriate regulatory standards (ISO 13485, IEC 60601 for electrical medical equipment, etc.)\n"
            "5. Consider Kenya Medical Supplies Authority (KEMSA) and Pharmacy & Poisons Board (PPB) requirements\n"
            "6. Maintain professional clinical tone suitable for healthcare procurement\n\n"
            "CONTENT GUIDELINES:\n"
            "- Short description: 1-2 compelling sentences for product listings (15-25 words)\n"
            "- Long description: 3-4 detailed paragraphs covering: clinical applications, key features, technical specifications, "
            "and regulatory/compliance information (150-250 words)\n"
            "- Meta title: 50-60 characters, SEO-optimized with brand and model\n"
            "- Meta description: 150-160 characters, keyword-rich for search visibility\n\n"
            "Always prioritize accuracy over marketing fluff. Healthcare professionals need precise, factual information."
        )

        payload = {
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "description": {"type": "STRING"},
                        "short_description": {"type": "STRING"},
                        "meta_title": {"type": "STRING"},
                        "meta_description": {"type": "STRING"},
                    },
                    "required": ["description", "short_description", "meta_title", "meta_description"],
                },
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                # Parse output
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                suggestions = json.loads(text_out)

                logger.info(
                    f"AI assist successfully generated descriptions for product '{product_name}' using Gemini API"
                )
                return {
                    "suggestions": suggestions,
                    "confidence": {
                        "description": 0.9,
                        "short_description": 0.9,
                        "meta_title": 0.9,
                        "meta_description": 0.9,
                    },
                }

        except Exception as e:
            logger.error(f"Failed to generate descriptions using Gemini API: {str(e)}. Falling back to stub.")
            return await self._generate_stub_descriptions(product_name, brand, category_name)

    async def _generate_stub_descriptions(self, product_name: str, brand: str, category_name: str) -> dict[str, Any]:
        """Fallback template-based descriptions if API call fails or key is missing."""
        suggestions = {
            "short_description": (
                f"Professional {category_name.lower()} by {brand}. "
                f"Reliable medical equipment designed for clinical accuracy and patient safety."
            ),
            "description": (
                f"The {product_name} by {brand} is a professional-grade {category_name.lower()} "
                f"designed for healthcare facilities in Kenya. Built to meet international medical device standards, "
                f"this equipment delivers reliable performance for diagnostic and therapeutic applications.\n\n"
                f"Clinical Applications:\n"
                f"Suitable for hospitals, clinics, and diagnostic centers requiring accurate and consistent results. "
                f"The device features intuitive controls and clear displays for efficient operation by trained healthcare professionals.\n\n"
                f"Technical Specifications:\n"
                f"Engineered for durability with quality components and construction. "
                f"Meets relevant electrical safety and performance standards for medical equipment.\n\n"
                f"Ideal for healthcare facilities seeking dependable medical equipment from {brand}, "
                f"a trusted name in medical technology."
            ),
            "meta_title": f"{product_name} | {brand} Medical - MyMedDevices Kenya",
            "meta_description": (
                f"Shop {product_name} by {brand}. Professional {category_name.lower()} "
                f"for hospitals & clinics in Kenya. Quality medical equipment with warranty."
            ),
        }

        return {
            "suggestions": suggestions,
            "confidence": {"description": 0.4, "short_description": 0.4, "meta_title": 0.5, "meta_description": 0.4},
        }

    async def generate_suggestions(
        self, product: Product, category: Category | None, fields_to_generate: list[str]
    ) -> dict[str, Any]:
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
        if product.model_number:
            prompt += f"Model Number: {product.model_number}\n"

        system_instruction = (
            "You are an expert AI catalog assistant for MyMedDevices, a medical device e-commerce marketplace in Kenya. "
            "You specialize in medical device taxonomy, clinical terminology, and regulatory compliance.\n\n"
            "PRODUCT DESCRIPTION REQUIREMENTS:\n"
            "- Use precise clinical and technical terminology appropriate for the device category\n"
            "- Cover intended use, clinical applications, and target patient population\n"
            "- Mention relevant features, modes, and technical capabilities\n"
            "- Include safety considerations and regulatory compliance information\n"
            "- Minimum 150 characters for full descriptions\n\n"
            "TECHNICAL SPECIFICATIONS GUIDELINES:\n"
            "- Generate 5-8 relevant key-value specification pairs based on device type\n"
            "- Common specifications by category:\n"
            "  * Imaging (X-ray, Ultrasound, MRI): kVp/mA range, frequency, resolution, detector type, image processing\n"
            "  * Monitoring (Patient monitors, ECG): display size, parameters measured, alarm functions, battery life\n"
            "  * Surgical (Instruments, tables): material grade (stainless steel 316L), dimensions, weight capacity, sterilization method\n"
            "  * Laboratory (Centrifuges, analyzers): RPM range, capacity, voltage, temperature range, throughput\n"
            "  * Diagnostic (Thermometers, BP monitors): accuracy range, measurement range, response time, power source\n\n"
            "TAGS GENERATION:\n"
            "- Include: device category, brand, clinical specialty, key features, power type (if applicable)\n"
            "- Use 5-8 relevant tags for discoverability\n\n"
            "SEO METADATA:\n"
            "- Meta title: 50-60 characters with brand, product name, and key differentiator\n"
            "- Meta description: 150-160 characters with clinical use case and key benefit"
        )

        # Build JSON response schema for Gemini Structured Output
        properties: dict[str, Any] = {}
        if "description" in fields_to_generate:
            properties["description"] = {"type": "STRING"}
        if "short_description" in fields_to_generate:
            properties["short_description"] = {"type": "STRING"}
        if "specifications" in fields_to_generate:
            properties["specifications"] = {"type": "OBJECT", "additionalProperties": {"type": "STRING"}}
        if "tags" in fields_to_generate:
            properties["tags"] = {"type": "ARRAY", "items": {"type": "STRING"}}
        if "meta_title" in fields_to_generate:
            properties["meta_title"] = {"type": "STRING"}
        if "meta_description" in fields_to_generate:
            properties["meta_description"] = {"type": "STRING"}

        payload = {
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {"type": "OBJECT", "properties": properties, "required": fields_to_generate},
            },
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
                return {"suggestions": suggestions, "confidence": confidence}

        except Exception as e:
            logger.error(f"Failed to generate suggestions using Gemini API: {str(e)}. Falling back to stub.")
            return await self._generate_stub_suggestions(product, category, fields_to_generate)

    async def _generate_stub_suggestions(
        self, product: Product, category: Category | None, fields_to_generate: list[str]
    ) -> dict[str, Any]:
        """Fallback template-based suggestions if API call fails or key is missing."""
        suggestions: dict[str, Any] = {}
        confidence: dict[str, Any] = {}
        category_name = category.name if category else "Medical Device"
        category_slug = category.slug if category else "medical-device"

        for field in fields_to_generate:
            if field == "description" and not product.description:
                suggestions["description"] = (
                    f"The {product.name} by {product.brand or 'the manufacturer'} is a professional {category_name.lower()} "
                    f"designed for clinical applications in hospitals, clinics, and healthcare facilities.\n\n"
                    f"Designed for accuracy and reliability, this {category_name.lower()} meets international medical device standards "
                    f"and is suitable for diagnostic and therapeutic use by trained healthcare professionals.\n\n"
                    f"Technical features include intuitive operation, durable construction, and compliance with relevant "
                    f"safety regulations. Please update this description with specific technical specifications, "
                    f"clinical applications, and intended use."
                )
                confidence["description"] = 0.3

            elif field == "short_description" and not product.short_description:
                suggestions["short_description"] = (
                    f"Professional {category_name.lower()} designed for clinical accuracy and reliability. "
                    f"Suitable for hospitals and healthcare facilities."
                )
                confidence["short_description"] = 0.3

            elif field == "specifications" and not product.specifications:
                # Category-aware specification suggestions
                category_lower = category_name.lower()
                specs = {}

                # Base specifications for all medical devices
                specs["Device Type"] = category_name
                specs["Intended Use"] = "Clinical/Diagnostic"

                # Category-specific specifications
                if any(word in category_lower for word in ["imaging", "x-ray", "ultrasound", "mri", "ct", "scanner"]):
                    specs.update(
                        {
                            "Power Supply": "220-240V AC, 50/60Hz",
                            "Imaging Technology": "Digital",
                            "Display": "High-resolution medical grade monitor",
                            "Image Storage": "DICOM compliant",
                            "Safety Standards": "IEC 60601-1 compliant",
                        }
                    )
                elif any(word in category_lower for word in ["monitor", "patient", "ecg", "pulse", "oximeter"]):
                    specs.update(
                        {
                            "Display": "LCD/LED touchscreen",
                            "Battery Backup": "Yes, minimum 4 hours",
                            "Parameters Monitored": "Multi-parameter",
                            "Alarm System": "Audio-visual with adjustable thresholds",
                            "Data Export": "HL7/EMR compatible",
                        }
                    )
                elif any(word in category_lower for word in ["surgical", "instrument", "table", "light", "microscope"]):
                    specs.update(
                        {
                            "Material": "Medical-grade stainless steel",
                            "Sterilization": "Autoclave compatible",
                            "Dimensions": "Standard hospital size",
                            "Weight Capacity": "Standard patient weight",
                            "Finish": "Corrosion-resistant",
                        }
                    )
                elif any(word in category_lower for word in ["laboratory", "centrifuge", "analyzer", "microscope"]):
                    specs.update(
                        {
                            "Power Requirements": "220-240V AC",
                            "Capacity": "Standard tube/sample size",
                            "Speed/Range": "Variable speed control",
                            "Temperature Control": "Ambient to specified range",
                            "Noise Level": "Low operation noise",
                        }
                    )
                elif any(
                    word in category_lower for word in ["thermometer", "bp", "blood pressure", "weighing", "scale"]
                ):
                    specs.update(
                        {
                            "Measurement Range": "Standard clinical range",
                            "Accuracy": "Clinically validated accuracy",
                            "Display": "Digital LCD/LED",
                            "Power Source": "Battery + AC adapter",
                            "Response Time": "< 5 seconds",
                        }
                    )
                else:
                    # Generic specifications
                    specs.update(
                        {
                            "Power Supply": "220-240V AC, 50Hz",
                            "Operating Temperature": "15-35°C",
                            "Storage Temperature": "-10 to 50°C",
                            "Humidity Range": "20-80% RH non-condensing",
                            "Safety Certifications": "CE/ISO compliant",
                        }
                    )

                suggestions["specifications"] = specs
                confidence["specifications"] = 0.4

            elif field == "tags" and not product.tags:
                tags = ["medical", "healthcare", "hospital", "clinic"]
                if category:
                    tags.extend([category_slug, category_name.lower().replace(" ", "-"), "kenya"])
                if product.brand:
                    tags.append(product.brand.lower().replace(" ", "-"))
                # Add category-specific tags
                category_lower = category_name.lower()
                if any(word in category_lower for word in ["imaging", "x-ray", "ultrasound", "ct"]):
                    tags.extend(["diagnostic", "radiology", "medical-imaging"])
                elif any(word in category_lower for word in ["monitor", "patient"]):
                    tags.extend(["patient-care", "icu", "critical-care"])
                elif any(word in category_lower for word in ["surgical"]):
                    tags.extend(["ot", "operating-room", "surgery"])
                elif any(word in category_lower for word in ["laboratory"]):
                    tags.extend(["diagnostic-lab", "pathology", "lab-equipment"])

                # Dedupe and limit
                suggestions["tags"] = list(dict.fromkeys(tags))[:8]
                confidence["tags"] = 0.6

            elif field == "meta_title" and not product.meta_title:
                brand_part = f" | {product.brand}" if product.brand else ""
                suggestions["meta_title"] = f"{product.name}{brand_part} - {category_name} - MyMedDevices Kenya"
                confidence["meta_title"] = 0.6

            elif field == "meta_description" and not product.meta_description:
                suggestions["meta_description"] = (
                    f"Shop {product.name} {product.brand or ''} - Professional {category_name.lower()} "
                    f"for hospitals & clinics in Kenya. Quality medical equipment with warranty. Fast delivery."
                )
                confidence["meta_description"] = 0.5

        return {"suggestions": suggestions, "confidence": confidence}

    async def validate_product(self, product: Product) -> list[dict[str, str]]:
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
            issues.append({"field": "price", "severity": "error", "message": "Price must be greater than zero"})

        # Description quality
        if product.description and len(product.description) < 50:
            issues.append(
                {
                    "field": "description",
                    "severity": "warning",
                    "message": "Description is too short. Aim for at least 50 characters for verification.",
                }
            )

        # Medical device specifics
        if not product.brand:
            issues.append(
                {
                    "field": "brand",
                    "severity": "warning",
                    "message": "Adding brand info improves buyer trust for medical devices",
                }
            )

        if not product.certifications and not product.ce_marking_or_fda_clearance:
            issues.append(
                {
                    "field": "certifications",
                    "severity": "warning",
                    "message": "Medical devices should include certification or CE/FDA clearance details",
                }
            )

        if not product.kmpdb_registration_number:
            issues.append(
                {
                    "field": "kmpdb_registration_number",
                    "severity": "warning",
                    "message": "KMPDB registration number is highly recommended for medical device classification",
                }
            )

        if not product.ppb_classification:
            issues.append(
                {
                    "field": "ppb_classification",
                    "severity": "warning",
                    "message": "PPB classification (Class A/B/C/D) is highly recommended for Pharmacy & Poisons Board compliance",
                }
            )

        logger.info(f"Product validation found {len(issues)} issues for product {product.id}")
        return issues

    async def ai_validate_product(self, product: Product, category: Category | None = None) -> dict[str, Any]:
        """
        AI-powered validation of product data for medical device taxonomy compliance.

        Uses Google Gemini API to perform comprehensive validation against medical device
        standards, checking for clinical inconsistencies, missing regulatory information,
        and taxonomy compliance issues.

        Args:
            product: The product to validate
            category: Optional category for additional context

        Returns:
            Dict with validation results:
            {
                "is_valid": bool,
                "confidence": float,
                "issues": [{"field": "...", "severity": "error|warning", "message": "..."}],
                "summary": str,
                "recommendations": [str]
            }
        """
        api_key = catalog_settings.GEMINI_API_KEY
        category_name = category.name if category else "Medical Device"
        model_name = catalog_settings.GEMINI_MODEL or "gemini-1.5-pro"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        if not api_key:
            logger.warning("GEMINI_API_KEY not configured. Using rule-based validation.")
            return await self._rule_based_validate(product, category_name)

        # Build product context for validation
        prompt = f"""
Please validate the following medical device product listing for taxonomy compliance and clinical accuracy:

Product Name: {product.name}
Brand: {product.brand or "Not specified"}
Category: {category_name}
Model Number: {product.model_number or "Not specified"}

Description: {product.description or "Not provided"}
Short Description: {product.short_description or "Not provided"}

Pricing:
- Retail Price: {product.price} {product.currency}
- Base Price: {product.base_price} {product.currency}
- Cost Price: {product.cost_price} {product.currency}

Regulatory & Compliance:
- Certifications: {", ".join(product.certifications) if product.certifications else "None specified"}
- CE/FDA Clearance: {product.ce_marking_or_fda_clearance or "Not specified"}
- KMPDB Registration: {product.kmpdb_registration_number or "Not specified"}
- PPB Classification: {product.ppb_classification or "Not specified"}

Technical Details:
- Specifications: {product.specifications or "Not provided"}
- Dimensions: {product.dimensions or "Not provided"}
- Weight: {f"{product.weight_kg} kg" if product.weight_kg else "Not specified"}

Marketing:
- Tags: {", ".join(product.tags) if product.tags else "None"}
- Meta Title: {product.meta_title or "Not provided"}
- Meta Description: {product.meta_description or "Not provided"}

Images: {len(product.images) if product.images else 0} image(s) uploaded
"""

        system_instruction = (
            "You are an expert medical device regulatory compliance analyst and taxonomy specialist for MyMedDevices, "
            "a medical device e-commerce marketplace in Kenya. Your role is to validate product listings against:\n"
            "1. Kenya Pharmacy and Poisons Board (PPB) classification standards (Class A/B/C/D)\n"
            "2. Medical device taxonomy and nomenclature conventions\n"
            "3. Clinical accuracy and consistency in descriptions\n"
            "4. Regulatory documentation completeness (CE, FDA, ISO, KMPDB)\n"
            "5. Medical device marketing best practices\n\n"
            "Analyze the product listing and identify:\n"
            "- Critical errors that would prevent publication (missing mandatory fields, invalid pricing, clinical inconsistencies)\n"
            "- Warnings for recommended improvements (missing optional but important fields, weak descriptions)\n"
            "- Recommendations for optimization (SEO, clinical accuracy, taxonomy alignment)\n\n"
            "Be thorough but practical. Focus on genuine issues that affect product quality, safety, or compliance."
        )

        payload = {
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "is_valid": {
                            "type": "BOOLEAN",
                            "description": "Whether the product passes critical validation checks",
                        },
                        "confidence": {"type": "NUMBER", "description": "Confidence score of the validation (0-1)"},
                        "issues": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "field": {"type": "STRING"},
                                    "severity": {"type": "STRING", "enum": ["error", "warning"]},
                                    "message": {"type": "STRING"},
                                },
                                "required": ["field", "severity", "message"],
                            },
                        },
                        "summary": {"type": "STRING", "description": "Overall validation summary"},
                        "recommendations": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                            "description": "Specific recommendations for improvement",
                        },
                    },
                    "required": ["is_valid", "confidence", "issues", "summary"],
                },
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                # Parse output
                text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                validation_result = json.loads(text_out)

                logger.info(
                    f"AI validation completed for product {product.id}. Valid: {validation_result.get('is_valid')}, Issues: {len(validation_result.get('issues', []))}"
                )

                return validation_result

        except Exception as e:
            logger.error(
                f"Failed to perform AI validation using Gemini API: {str(e)}. Falling back to rule-based validation."
            )
            return await self._rule_based_validate(product, category_name)

    async def _rule_based_validate(self, product: Product, category_name: str) -> dict[str, Any]:
        """
        Fallback rule-based validation if AI API call fails or key is missing.
        """
        issues = []
        recommendations = []

        # Critical errors
        actual_price = product.base_price or product.price
        if not actual_price or actual_price <= 0:
            issues.append(
                {
                    "field": "price",
                    "severity": "error",
                    "message": "Valid pricing information is required for publication",
                }
            )

        if not product.name or not product.slug:
            issues.append({"field": "name", "severity": "error", "message": "Product name and slug are required"})

        if not product.description or len(product.description) < 50:
            issues.append(
                {
                    "field": "description",
                    "severity": "error",
                    "message": "Description must be at least 50 characters for verification",
                }
            )

        # Warnings
        if not product.brand:
            issues.append(
                {
                    "field": "brand",
                    "severity": "warning",
                    "message": "Brand information improves buyer trust and searchability",
                }
            )
            recommendations.append("Add manufacturer/brand information")

        if not product.certifications and not product.ce_marking_or_fda_clearance:
            issues.append(
                {
                    "field": "certifications",
                    "severity": "warning",
                    "message": "Medical devices should include certification or clearance details",
                }
            )
            recommendations.append("Add regulatory certifications (CE, FDA, ISO 13485)")

        if not product.kmpdb_registration_number:
            issues.append(
                {
                    "field": "kmpdb_registration_number",
                    "severity": "warning",
                    "message": "KMPDB registration is recommended for Kenya market compliance",
                }
            )
            recommendations.append("Add KMPDB registration number for local compliance")

        if not product.ppb_classification:
            issues.append(
                {
                    "field": "ppb_classification",
                    "severity": "warning",
                    "message": "PPB risk classification (Class A/B/C/D) is highly recommended",
                }
            )
            recommendations.append("Assign PPB risk classification")

        if not product.images or len(product.images) == 0:
            issues.append(
                {
                    "field": "images",
                    "severity": "warning",
                    "message": "Product images are essential for buyer confidence",
                }
            )
            recommendations.append("Upload high-quality product images")

        if (
            not product.specifications
            or not isinstance(product.specifications, dict)
            or len(product.specifications) == 0
        ):
            issues.append(
                {
                    "field": "specifications",
                    "severity": "warning",
                    "message": "Technical specifications help buyers compare products",
                }
            )
            recommendations.append("Add detailed technical specifications")

        is_valid = all(issue["severity"] != "error" for issue in issues)
        confidence = 0.7 if is_valid else 0.5

        summary = (
            f"Product validation {'passed' if is_valid else 'failed'}. "
            f"Found {len([i for i in issues if i['severity'] == 'error'])} critical issue(s) "
            f"and {len([i for i in issues if i['severity'] == 'warning'])} warning(s)."
        )

        return {
            "is_valid": is_valid,
            "confidence": confidence,
            "issues": issues,
            "summary": summary,
            "recommendations": recommendations,
        }
