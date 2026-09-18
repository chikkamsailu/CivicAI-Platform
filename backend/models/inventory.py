from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from backend.database import Base

class InventoryItem(Base):
    __tablename__ = 'inventory_items'

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    unit = Column(String(50), nullable=False)
    quantity_in_stock = Column(Integer, default=0)
    minimum_threshold = Column(Integer, default=10)
    unit_cost = Column(Float, default=0.0)
    last_restocked = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default='In Stock')

class MaterialConsumption(Base):
    __tablename__ = 'material_consumption'

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(50), ForeignKey('complaints.id'), nullable=False, index=True)
    item_id = Column(String(50), ForeignKey('inventory_items.id'), nullable=False)
    quantity_used = Column(Integer, default=1)
    logged_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String(255), nullable=True)

