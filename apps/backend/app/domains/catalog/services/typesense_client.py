import json
import uuid
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
import typesense
from typesense.exceptions import ObjectNotFound, TypesenseClientError

from app.core.logging import logger

from app.domains.catalog.config import settings
from app.domains.catalog.models.product import Product

class TypesenseProductImage:
    def __init__(self, img_dict: dict):
        self.id = uuid.UUID(img_dict["id"]) if isinstance(img_dict.get("id"), str) else img_dict.get("id")
        self.url = img_dict["url"]
        self.alt_text = img_dict.get("alt_text")
        self.sort_order = img_dict.get("sort_order", 0)
        self.is_primary = img_dict.get("is_primary", False)
        
        cat = img_dict.get("created_at")
        if cat:
            if isinstance(cat, (int, float)):
                self.created_at = datetime.fromtimestamp(cat)
            elif isinstance(cat, str):
                try:
                    self.created_at = datetime.fromisoformat(cat)
                except Exception:
                    self.created_at = datetime.utcnow()
            else:
                self.created_at = datetime.utcnow()
        else:
            self.created_at = datetime.utcnow()

class TypesenseProductDTO:
    def __init__(self, doc: dict):
        self.id = uuid.UUID(doc["id"]) if isinstance(doc.get("id"), str) else doc.get("id")
        self.category_id = uuid.UUID(doc["category_id"]) if doc.get("category_id") else None
        self.category_name = doc.get("category_name")
        self.name = doc["name"]
        self.slug = doc["slug"]
        self.description = doc.get("description")
        self.short_description = doc.get("short_description")
        self.price = doc.get("price")
        self.currency = doc.get("currency", "KES")
        self.is_on_sale = doc.get("is_on_sale", False)
        self.stock_quantity = doc.get("stock_quantity", 0)
        self.in_stock = self.stock_quantity > 0
        self.is_featured = doc.get("is_featured", False)
        self.popularity_score = doc.get("popularity_score", 0)
        self.weight_kg = doc.get("weight_kg")
        
        # Deserialize JSON strings/objects
        dims = doc.get("dimensions")
        if dims and isinstance(dims, str):
            try:
                self.dimensions = json.loads(dims)
            except Exception:
                self.dimensions = None
        else:
            self.dimensions = dims
            
        self.brand = doc.get("brand")
        self.model_number = doc.get("model_number")
        self.manufacturer = doc.get("manufacturer")
        
        specs = doc.get("specifications")
        if specs and isinstance(specs, str):
            try:
                self.specifications = json.loads(specs)
            except Exception:
                self.specifications = None
        else:
            self.specifications = specs
            
        certs = doc.get("certifications")
        if certs and isinstance(certs, str):
            try:
                self.certifications = json.loads(certs)
            except Exception:
                self.certifications = None
        else:
            self.certifications = certs
            
        self.kmpdb_registration_number = doc.get("kmpdb_registration_number")
        self.ppb_classification = doc.get("ppb_classification")
        self.ce_marking_or_fda_clearance = doc.get("ce_marking_or_fda_clearance")
        self.warranty_info = doc.get("warranty_info")
        self.meta_title = doc.get("meta_title")
        self.meta_description = doc.get("meta_description")
        
        tags_val = doc.get("tags")
        if tags_val:
            if isinstance(tags_val, str):
                try:
                    self.tags = json.loads(tags_val)
                except Exception:
                    self.tags = []
            else:
                self.tags = tags_val
        else:
            self.tags = []
            
        imgs = doc.get("images")
        if imgs:
            if isinstance(imgs, str):
                try:
                    parsed_imgs = json.loads(imgs)
                except Exception:
                    parsed_imgs = []
            else:
                parsed_imgs = imgs
            self.images = [TypesenseProductImage(img) for img in parsed_imgs]
        else:
            self.images = []
            
        created_at_val = doc.get("created_at")
        if created_at_val:
            if isinstance(created_at_val, (int, float)):
                self.created_at = datetime.fromtimestamp(created_at_val)
            else:
                try:
                    self.created_at = datetime.fromisoformat(created_at_val)
                except Exception:
                    self.created_at = datetime.utcnow()
        else:
            self.created_at = datetime.utcnow()
            
        if self.category_id or self.category_name:
            self.category = type("CategoryDTO", (), {
                "id": self.category_id,
                "name": self.category_name,
                "slug": doc.get("category_slug")
            })
        else:
            self.category = None

class TypesenseClient:
    def __init__(self):
        self.client = None
        if not settings.TYPESENSE_API_KEY:
            logger.warning("TYPESENSE_API_KEY is not set. Typesense integration will be disabled.")
            return

        self.client = typesense.Client({
            'nodes': [{
                'host': settings.TYPESENSE_HOST,
                'port': str(settings.TYPESENSE_PORT),
                'protocol': settings.TYPESENSE_PROTOCOL
            }],
            'api_key': settings.TYPESENSE_API_KEY,
            'connection_timeout_seconds': 2
        })
        self._ensure_collection()

    def _ensure_collection(self):
        if not self.client:
            return
        
        schema = {
            "name": "products",
            "fields": [
                {"name": "id", "type": "string"},
                {"name": "name", "type": "string"},
                {"name": "slug", "type": "string"},
                {"name": "description", "type": "string", "optional": True},
                {"name": "short_description", "type": "string", "optional": True},
                {"name": "price", "type": "float", "optional": True, "facet": True},
                {"name": "currency", "type": "string"},
                {"name": "is_on_sale", "type": "bool", "facet": True},
                {"name": "in_stock", "type": "bool", "facet": True},
                {"name": "stock_quantity", "type": "int32", "optional": True},
                {"name": "is_featured", "type": "bool", "facet": True},
                {"name": "popularity_score", "type": "int32"},
                {"name": "category_id", "type": "string", "optional": True, "facet": True},
                {"name": "category_name", "type": "string", "optional": True, "facet": True},
                {"name": "category_slug", "type": "string", "optional": True, "facet": True},
                {"name": "brand", "type": "string", "optional": True, "facet": True},
                {"name": "model_number", "type": "string", "optional": True},
                {"name": "manufacturer", "type": "string", "optional": True, "facet": True},
                {"name": "kmpdb_registration_number", "type": "string", "optional": True},
                {"name": "ppb_classification", "type": "string", "optional": True, "facet": True},
                {"name": "ce_marking_or_fda_clearance", "type": "string", "optional": True},
                {"name": "warranty_info", "type": "string", "optional": True},
                {"name": "meta_title", "type": "string", "optional": True},
                {"name": "meta_description", "type": "string", "optional": True},
                {"name": "tags", "type": "string[]", "optional": True, "facet": True},
                {"name": "images", "type": "string", "optional": True},
                {"name": "dimensions", "type": "string", "optional": True},
                {"name": "specifications", "type": "string", "optional": True},
                {"name": "certifications", "type": "string", "optional": True},
                {"name": "status", "type": "string", "facet": True},
                {"name": "is_deleted", "type": "bool", "facet": True},
                {"name": "created_at", "type": "int64"}
            ],
            "default_sorting_field": "popularity_score"
        }
        
        try:
            self.client.collections['products'].retrieve()
            logger.info("Typesense products collection already exists.")
        except ObjectNotFound:
            logger.info("Typesense products collection does not exist. Creating...")
            try:
                self.client.collections.create(schema)
                logger.info("Successfully created Typesense products collection.")
            except Exception as e:
                logger.error(f"Failed to create Typesense products collection: {e}")
        except Exception as e:
            logger.error(f"Failed to connect to Typesense to check/create collection: {e}")

    def index_product(self, product: Product):
        if not self.client:
            return

        # Prepare images list of dicts
        images_list = []
        if product.images:
            for img in product.images:
                images_list.append({
                    "id": str(img.id),
                    "url": img.url,
                    "alt_text": img.alt_text,
                    "sort_order": img.sort_order,
                    "is_primary": img.is_primary,
                    "created_at": img.created_at.isoformat() if img.created_at else datetime.utcnow().isoformat()
                })

        document = {
            "id": str(product.id),
            "name": product.name,
            "slug": product.slug,
            "description": product.description or "",
            "short_description": product.short_description or "",
            "price": float(product.price) if product.price is not None else None,
            "currency": product.currency or "KES",
            "is_on_sale": bool(product.is_on_sale),
            "in_stock": product.stock_quantity > 0,
            "stock_quantity": int(product.stock_quantity) if product.stock_quantity is not None else 0,
            "is_featured": bool(product.is_featured),
            "popularity_score": int(product.popularity_score) if product.popularity_score is not None else 0,
            "category_id": str(product.category_id) if product.category_id else "",
            "category_name": product.category.name if product.category else "",
            "category_slug": product.category.slug if product.category else "",
            "brand": product.brand or "",
            "model_number": product.model_number or "",
            "manufacturer": product.manufacturer or "",
            "kmpdb_registration_number": product.kmpdb_registration_number or "",
            "ppb_classification": product.ppb_classification or "",
            "ce_marking_or_fda_clearance": product.ce_marking_or_fda_clearance or "",
            "warranty_info": product.warranty_info or "",
            "meta_title": product.meta_title or "",
            "meta_description": product.meta_description or "",
            "tags": product.tags if isinstance(product.tags, list) else [],
            "images": json.dumps(images_list),
            "dimensions": json.dumps(product.dimensions) if product.dimensions else None,
            "specifications": json.dumps(product.specifications) if product.specifications else None,
            "certifications": json.dumps(product.certifications) if product.certifications else None,
            "status": product.status,
            "is_deleted": bool(product.is_deleted),
            "created_at": int(product.created_at.timestamp()) if product.created_at else int(datetime.utcnow().timestamp())
        }

        try:
            self.client.collections['products'].documents.upsert(document)
            logger.info(f"Indexed product {product.id} to Typesense.")
        except Exception as e:
            logger.error(f"Failed to index product {product.id} in Typesense: {e}")

    def delete_product(self, product_id: str):
        if not self.client:
            return

        try:
            self.client.collections['products'].documents[str(product_id)].delete()
            logger.info(f"Deleted product {product_id} from Typesense.")
        except ObjectNotFound:
            logger.warning(f"Product {product_id} not found in Typesense for deletion.")
        except Exception as e:
            logger.error(f"Failed to delete product {product_id} from Typesense: {e}")

    def search_storefront(
        self,
        category_id: Optional[str] = None,
        category_slug: Optional[str] = None,
        search: Optional[str] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        is_featured: Optional[bool] = None,
        is_on_sale: Optional[bool] = None,
        in_stock: Optional[bool] = None,
        sort_by: str = "newest",
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[TypesenseProductDTO], int]:
        if not self.client:
            logger.warning("Typesense search called but client is disabled. Returning empty list.")
            return [], 0

        # Construct filters
        filter_parts = ["status:=published", "is_deleted:=false"]
        if category_id:
            filter_parts.append(f"category_id:={category_id}")
        if category_slug:
            filter_parts.append(f"category_slug:={category_slug}")
        if price_min is not None:
            filter_parts.append(f"price:>={price_min}")
        if price_max is not None:
            filter_parts.append(f"price:<={price_max}")
        if is_featured is not None:
            filter_parts.append(f"is_featured:={str(is_featured).lower()}")
        if is_on_sale is not None:
            filter_parts.append(f"is_on_sale:={str(is_on_sale).lower()}")
        if in_stock is True:
            filter_parts.append("in_stock:=true")

        filter_by = " && ".join(filter_parts) if filter_parts else None

        sort_by_param = "popularity_score:desc"
        if sort_by == "newest":
            sort_by_param = "created_at:desc"
        elif sort_by == "price_asc":
            sort_by_param = "price:asc"
        elif sort_by == "price_desc":
            sort_by_param = "price:desc"
        elif sort_by == "popular":
            sort_by_param = "popularity_score:desc"
        elif sort_by == "name_asc":
            sort_by_param = "name:asc"

        search_parameters = {
            'q': search if search else '*',
            'query_by': 'name,brand,description,short_description',
            'sort_by': sort_by_param,
            'page': page,
            'per_page': page_size
        }
        if filter_by:
            search_parameters['filter_by'] = filter_by

        try:
            results = self.client.collections['products'].documents.search(search_parameters)
            total = results.get('found', 0)
            hits = results.get('hits', [])
            
            products = []
            for hit in hits:
                doc = hit.get('document', {})
                products.append(TypesenseProductDTO(doc))
                
            return products, total
        except Exception as e:
            logger.error(f"Typesense search failed: {e}")
            return [], 0
