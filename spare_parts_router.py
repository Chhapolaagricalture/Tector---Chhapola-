"""
Spare Parts Search Router — Dynamic Multi-Source Architecture
=============================================================
Phase 3: Chhapola Agriculture — Spare Parts & Price Analysis

Sources:
  1. SerpApi Google Shopping (PRIMARY) — real prices across Indian stores
  2. Amazon PA API (FUTURE) — requires Associates account
  3. Flipkart Affiliate API (FUTURE) — requires affiliate registration
  4. Chhapola Sellers (FUTURE) — seller marketplace

Architecture: Adapter pattern — each source implements SourceAdapter interface.
"""

from __future__ import annotations

import logging
import os
import time
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

logger = logging.getLogger("chhapola.spare_parts")

router = APIRouter(prefix="/api/spare-parts", tags=["spare_parts"])


# ==============================================
# PYDANTIC MODELS
# ==============================================


class SearchResult(BaseModel):
    """Normalized product result from any source."""
    productName: str = ""
    brand: str = ""
    partNumber: str = ""
    tractorCompatibility: str = ""
    price: Optional[float] = None
    currency: str = "INR"
    deliveryCharge: Optional[float] = None
    totalPrice: Optional[float] = None
    availability: str = "unknown"
    sellerName: str = ""
    sourceName: str = ""
    sourceType: str = ""  # official, marketplace, platform
    productUrl: str = ""
    imageUrl: str = ""
    lastUpdated: str = ""
    verified: bool = False
    rating: Optional[float] = None
    reviewCount: Optional[int] = None


class SearchResponse(BaseModel):
    """Response from spare parts search."""
    success: bool = True
    query: str = ""
    tractorCompany: str = ""
    tractorModel: str = ""
    totalResults: int = 0
    sources: List[str] = []
    results: List[SearchResult] = []
    bestPrice: Optional[float] = None
    lowestSource: str = ""
    message: str = ""


# ==============================================
# SOURCE ADAPTER INTERFACE
# ==============================================


class SourceAdapter(ABC):
    """Base class for all price source adapters."""

    @property
    @abstractmethod
    def source_id(self) -> str:
        """Unique source identifier."""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Human-readable source name."""
        pass

    @property
    @abstractmethod
    def source_type(self) -> str:
        """Source type: official, marketplace, platform."""
        pass

    @abstractmethod
    def search(
        self,
        query: str,
        tractor_company: str = "",
        tractor_model: str = "",
        category: str = "",
    ) -> List[SearchResult]:
        """Search for products. Returns normalized results."""
        pass

    @property
    def is_available(self) -> bool:
        """Check if this source has required credentials."""
        return True


# ==============================================
# SERPAPI GOOGLE SHOPPING ADAPTER (PRIMARY)
# ==============================================


class SerpApiShoppingAdapter(SourceAdapter):
    """
    SerpApi Google Shopping — searches across Amazon India, Flipkart,
    IndiaMART, and other Indian stores. Returns real prices.

    Requires: SERPAPI_KEY environment variable.
    Free tier: 100 searches/month. Paid plans available.
    """

    def __init__(self):
        self._api_key = os.getenv("SERPAPI_KEY", "")

    @property
    def source_id(self) -> str:
        return "serpapi_shopping"

    @property
    def source_name(self) -> str:
        return "Google Shopping (SerpApi)"

    @property
    def source_type(self) -> str:
        return "marketplace"

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    def search(
        self,
        query: str,
        tractor_company: str = "",
        tractor_model: str = "",
        category: str = "",
    ) -> List[SearchResult]:
        if not self._api_key:
            return []

        # Build search query
        search_query = self._build_query(query, tractor_company, tractor_model)

        try:
            params = {
                "engine": "google_shopping",
                "q": search_query,
                "api_key": self._api_key,
                "gl": "in",  # India
                "hl": "en",
                "num": 20,
            }

            response = requests.get(
                "https://serpapi.com/search",
                params=params,
                timeout=15,
            )

            if response.status_code != 200:
                logger.warning("SerpApi error %d: %s", response.status_code, response.text[:200])
                return []

            data = response.json()
            shopping_results = data.get("shopping_results", [])

            results = []
            for item in shopping_results:
                result = self._normalize_item(item, search_query)
                if result:
                    results.append(result)

            return results

        except requests.Timeout:
            logger.warning("SerpApi timeout for query: %s", search_query)
            return []
        except Exception as e:
            logger.exception("SerpApi search error: %s", str(e))
            return []

    def _build_query(self, query: str, company: str, model: str) -> str:
        """Build optimal search query."""
        parts = []
        if company:
            parts.append(company)
        if model:
            parts.append(model)
        parts.append(query)
        return " ".join(parts).strip()

    def _normalize_item(self, item: dict, query: str) -> Optional[SearchResult]:
        """Convert SerpApi shopping result to normalized format."""
        try:
            title = item.get("title", "").strip()
            if not title:
                return None

            # Extract price (handle Indian Rupee format)
            price = None
            price_str = item.get("price", "")
            if price_str:
                # Remove currency symbols, commas, spaces
                cleaned = price_str.replace("₹", "").replace(",", "").replace(" ", "").strip()
                # Handle "₹390" or "Rs. 390" or "390.00"
                import re
                price_match = re.search(r"[\d]+(?:\.\d+)?", cleaned)
                if price_match:
                    price = float(price_match.group())

            # Extract extracted_price (more reliable)
            extracted_price = item.get("extracted_price")
            if extracted_price is not None:
                try:
                    price = float(extracted_price)
                except (ValueError, TypeError):
                    pass

            # Delivery
            delivery_charge = None
            delivery_text = item.get("delivery", "")
            if delivery_text:
                import re
                delivery_match = re.search(r"[\d]+(?:\.\d+)?", delivery_text.replace("₹", "").replace(",", ""))
                if delivery_match and "free" not in delivery_text.lower():
                    delivery_charge = float(delivery_match.group())

            # Total price
            total_price = None
            if price is not None:
                total_price = price + (delivery_charge or 0)

            # Availability
            availability = "unknown"
            if item.get("available"):
                availability = "in_stock"
            elif "out of stock" in str(item.get("delivery", "")).lower():
                availability = "out_of_stock"
            elif price is not None:
                availability = "in_stock"

            # Rating
            rating = None
            reviews = None
            rating_str = item.get("rating")
            if rating_str:
                try:
                    rating = float(rating_str)
                except (ValueError, TypeError):
                    pass
            reviews_str = item.get("reviews")
            if reviews_str:
                try:
                    reviews = int(str(reviews_str).replace(",", ""))
                except (ValueError, TypeError):
                    pass

            # Source/seller
            source = item.get("source", "")
            platform = item.get("platform", "")

            return SearchResult(
                productName=title,
                brand=item.get("brand", "") or self._extract_brand(title),
                partNumber=item.get("product_id", ""),
                tractorCompatibility="",
                price=price,
                deliveryCharge=delivery_charge,
                totalPrice=total_price,
                availability=availability,
                sellerName=source or platform or "Unknown Seller",
                sourceName=source or platform or "Google Shopping",
                sourceType="marketplace",
                productUrl=item.get("link", "") or item.get("product_link", ""),
                imageUrl=item.get("thumbnail", "") or item.get("image", ""),
                lastUpdated=datetime.utcnow().strftime("%Y-%m-%d"),
                verified=bool(item.get("rating")),
                rating=rating,
                reviewCount=reviews,
            )
        except Exception as e:
            logger.warning("Error normalizing SerpApi item: %s", str(e))
            return None

    def _extract_brand(self, title: str) -> str:
        """Try to extract brand from product title."""
        known_brands = [
            "Swaraj", "Mahindra", "Sonalika", "John Deere", "New Holland",
            "Farmtrac", "Massey Ferguson", "Eicher", "Powertrac", "Kubota",
            "Filters Plus", "Mobil", "Shell", "Gulf", "Castrol", "Bosch",
            "Lucas", "TVS", "SKF", "Timken", "NGK", "Champion",
        ]
        title_lower = title.lower()
        for brand in known_brands:
            if brand.lower() in title_lower:
                return brand
        return ""


# ==============================================
# WEB SEARCH ADAPTER (fallback using SerpApi)
# ==============================================


class WebSearchAdapter(SourceAdapter):
    """
    Uses SerpApi Google Search as fallback when Shopping returns no results.
    Searches for product pages across Indian websites.
    """

    def __init__(self):
        self._api_key = os.getenv("SERPAPI_KEY", "")

    @property
    def source_id(self) -> str:
        return "web_search"

    @property
    def source_name(self) -> str:
        return "Web Search"

    @property
    def source_type(self) -> str:
        return "web"

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    def search(
        self,
        query: str,
        tractor_company: str = "",
        tractor_model: str = "",
        category: str = "",
    ) -> List[SearchResult]:
        if not self._api_key:
            return []

        search_query = f"{tractor_company} {tractor_model} {query} buy price India".strip()

        try:
            params = {
                "engine": "google",
                "q": search_query,
                "api_key": self._api_key,
                "gl": "in",
                "hl": "en",
                "num": 10,
            }

            response = requests.get(
                "https://serpapi.com/search",
                params=params,
                timeout=15,
            )

            if response.status_code != 200:
                return []

            data = response.json()
            organic = data.get("organic_results", [])

            results = []
            for item in organic[:10]:
                title = item.get("title", "")
                link = item.get("link", "")
                snippet = item.get("snippet", "")

                # Only include results that look like product pages
                if not title or not link:
                    continue

                # Skip non-product results
                skip_domains = ["youtube.com", "wikipedia.org", "quora.com", "reddit.com"]
                if any(d in link for d in skip_domains):
                    continue

                # Try to extract price from snippet
                import re
                price = None
                price_match = re.search(r"₹\s*[\d,]+(?:\.\d+)?", snippet)
                if price_match:
                    cleaned = price_match.group().replace("₹", "").replace(",", "").strip()
                    try:
                        price = float(cleaned)
                    except ValueError:
                        pass

                # Determine source name from domain
                source_name = self._extract_source_name(link)

                results.append(SearchResult(
                    productName=title[:200],
                    brand="",
                    partNumber="",
                    tractorCompatibility=f"{tractor_company} {tractor_model}".strip(),
                    price=price,
                    totalPrice=price,
                    availability="check_source",
                    sellerName=source_name,
                    sourceName=source_name,
                    sourceType="web",
                    productUrl=link,
                    lastUpdated=datetime.utcnow().strftime("%Y-%m-%d"),
                    verified=False,
                ))

            return results

        except Exception as e:
            logger.warning("Web search error: %s", str(e))
            return []

    def _extract_source_name(self, url: str) -> str:
        """Extract readable source name from URL."""
        import re
        domain_match = re.search(r"https?://(?:www\.)?([^/]+)", url)
        if domain_match:
            domain = domain_match.group(1).lower()
            # Map known domains to readable names
            domain_map = {
                "amazon.in": "Amazon India",
                "amazon.com": "Amazon",
                "flipkart.com": "Flipkart",
                "indiamart.com": "IndiaMART",
                "moglix.com": "Moglix",
                " industrybuying.com": "Industry Buying",
                "bodewala.com": "Bodewala",
                "tradesparq.com": "TradeSparq",
                "go parts": "GoParts",
                "partsbigboss.com": "PartsBigBoss",
            }
            for key, name in domain_map.items():
                if key in domain:
                    return name
            return domain.split(".")[0].title()
        return "Web Source"


# ==============================================
# SOURCE REGISTRY
# ==============================================


# Register all available adapters
ADAPTERS: List[SourceAdapter] = [
    SerpApiShoppingAdapter(),
    WebSearchAdapter(),
]


def get_active_adapters() -> List[SourceAdapter]:
    """Return only adapters with valid credentials."""
    return [a for a in ADAPTERS if a.is_available]


def search_all_sources(
    query: str,
    tractor_company: str = "",
    tractor_model: str = "",
    category: str = "",
) -> List[SearchResult]:
    """Search all active sources and merge results."""
    all_results: List[SearchResult] = []

    for adapter in get_active_adapters():
        try:
            results = adapter.search(query, tractor_company, tractor_model, category)
            # Tag results with source
            for r in results:
                if not r.sourceName:
                    r.sourceName = adapter.source_name
                if not r.sourceType:
                    r.sourceType = adapter.source_type
            all_results.extend(results)
        except Exception as e:
            logger.warning("Adapter %s failed: %s", adapter.source_id, str(e))

    return all_results


def compute_price_analysis(results: List[SearchResult]) -> dict:
    """Compute price comparison metrics from results."""
    priced = [r for r in results if r.price is not None and r.price > 0]

    if not priced:
        return {
            "bestPrice": None,
            "lowestSource": "",
            "highestPrice": None,
            "averagePrice": None,
            "priceDifference": None,
            "sourceCount": len(results),
            "pricedCount": 0,
        }

    prices = [r.price for r in priced]
    best = min(priced, key=lambda r: r.totalPrice or r.price)
    worst = max(priced, key=lambda r: r.totalPrice or r.price)

    return {
        "bestPrice": best.totalPrice or best.price,
        "lowestSource": best.sourceName,
        "highestPrice": worst.totalPrice or worst.price,
        "averagePrice": round(sum(prices) / len(prices), 2),
        "priceDifference": round((worst.totalPrice or worst.price) - (best.totalPrice or best.price), 2),
        "sourceCount": len(results),
        "pricedCount": len(priced),
    }


# ==============================================
# API ENDPOINTS
# ==============================================


@router.get("/search", response_model=SearchResponse)
async def search_spare_parts(
    request: Request,
    q: str = Query(..., description="Part search query (e.g., 'oil filter', 'ऑयल फिल्टर')"),
    company: str = Query("", description="Tractor company (e.g., 'Swaraj')"),
    model: str = Query("", description="Tractor model (e.g., '744 XT')"),
    category: str = Query("", description="Part category filter"),
):
    """
    Dynamic spare parts search across multiple external sources.

    Returns real product data from Google Shopping (Amazon India, Flipkart,
    IndiaMART, etc.) via SerpApi.

    No hardcoded products — all results come from live external sources.
    """
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query is required")

    # Check if any source is available
    active = get_active_adapters()
    if not active:
        return SearchResponse(
            success=True,
            query=q,
            tractorCompany=company,
            tractorModel=model,
            totalResults=0,
            sources=[],
            results=[],
            message="No external sources configured. Add SERPAPI_KEY to enable Google Shopping search.",
        )

    # Search all sources
    results = search_all_sources(q.strip(), company.strip(), model.strip(), category)

    # Filter by category if specified
    if category:
        results = [r for r in results if category.lower() in r.productName.lower()
                   or category.lower() in r.sourceName.lower()]

    # Deduplicate similar products
    results = _deduplicate_results(results)

    # Compute analysis
    analysis = compute_price_analysis(results)

    # Get source names
    sources_used = list(set(r.sourceName for r in results))

    return SearchResponse(
        success=True,
        query=q,
        tractorCompany=company,
        tractorModel=model,
        totalResults=len(results),
        sources=sources_used,
        results=results,
        bestPrice=analysis["bestPrice"],
        lowestSource=analysis["lowestSource"],
        message=f"Found {len(results)} results from {len(sources_used)} source(s)" if results
                else "No verified results found for this search. Try different keywords.",
    )


@router.get("/sources")
async def list_sources():
    """List all available sources and their status."""
    all_sources = []
    for adapter in ADAPTERS:
        all_sources.append({
            "id": adapter.source_id,
            "name": adapter.source_name,
            "type": adapter.source_type,
            "available": adapter.is_available,
            "configured": adapter.is_available,
        })
    return {"sources": all_sources}


@router.get("/price-comparison")
async def price_comparison(
    request: Request,
    q: str = Query(..., description="Part search query"),
    company: str = Query("", description="Tractor company"),
    model: str = Query("", description="Tractor model"),
):
    """
    Get price comparison analysis for a specific part.
    Returns best price, highest, average, and per-source breakdown.
    """
    results = search_all_sources(q.strip(), company.strip(), model.strip())
    results = _deduplicate_results(results)
    analysis = compute_price_analysis(results)

    # Group by source
    source_breakdown = {}
    for r in results:
        src = r.sourceName
        if src not in source_breakdown:
            source_breakdown[src] = {
                "sourceName": src,
                "sourceType": r.sourceType,
                "products": [],
                "lowestPrice": None,
                "highestPrice": None,
            }
        source_breakdown[src]["products"].append({
            "productName": r.productName,
            "price": r.price,
            "deliveryCharge": r.deliveryCharge,
            "totalPrice": r.totalPrice,
            "availability": r.availability,
            "productUrl": r.productUrl,
        })
        if r.price is not None:
            if source_breakdown[src]["lowestPrice"] is None or r.price < source_breakdown[src]["lowestPrice"]:
                source_breakdown[src]["lowestPrice"] = r.price
            if source_breakdown[src]["highestPrice"] is None or r.price > source_breakdown[src]["highestPrice"]:
                source_breakdown[src]["highestPrice"] = r.price

    return {
        "query": q,
        "company": company,
        "model": model,
        "analysis": analysis,
        "sources": list(source_breakdown.values()),
    }


# ==============================================
# HELPERS
# ==============================================


def _deduplicate_results(results: List[SearchResult]) -> List[SearchResult]:
    """Remove duplicate products based on name similarity."""
    if not results:
        return []

    seen = set()
    unique = []

    for r in results:
        # Create a key from normalized product name
        key = r.productName.lower().strip()[:80]
        # Also consider source to avoid removing same product from different sources
        full_key = f"{key}|{r.sourceName}"

        if full_key not in seen:
            seen.add(full_key)
            unique.append(r)

    return unique
