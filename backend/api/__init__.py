from backend.api.complaints import router as complaints_router
from backend.api.ai import router as ai_router
from backend.api.institutions import router as institutions_router
from backend.api.field_ops import router as field_ops_router
from backend.api.inventory import router as inventory_router
from backend.api.gis import router as gis_router

__all__ = [
    'complaints_router',
    'ai_router',
    'institutions_router',
    'field_ops_router',
    'inventory_router',
    'gis_router'
]
