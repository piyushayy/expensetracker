from pydantic import BaseModel

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str

class Expense(ExpenseCreate):
    id: int

    class Config:
        from_attributes = True