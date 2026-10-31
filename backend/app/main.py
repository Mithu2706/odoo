import os, secrets, re
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from calendar import monthrange
from typing import Literal
import jwt
from fastapi import FastAPI, Depends, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, model_validator
from pwdlib import PasswordHash
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .models import (
    Workspace,
    User,
    Customer,
    Product,
    Variant,
    Plan,
    Subscription,
    SubscriptionItem,
    Invoice,
    InvoiceItem,
    Payment,
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brightloop.db")
engine = create_engine(
    DATABASE_URL,
    **(
        {"connect_args": {"check_same_thread": False}}
        if DATABASE_URL.startswith("sqlite")
        else {}
    ),
)
SECRET = os.getenv("SECRET_KEY", "")
if len(SECRET) < 32:
    raise RuntimeError("Set SECRET_KEY to a random value of at least 32 characters")
origins = [
    x.strip()
    for x in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
]
app = FastAPI(title="Brightloop API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)
hasher = PasswordHash.recommended()


def db():
    with Session(engine) as session:
        yield session


@app.middleware("http")
async def security(request: Request, call_next):
    if (
        request.method in ("POST", "PATCH", "DELETE", "PUT")
        and request.headers.get("origin")
        and request.headers["origin"] not in origins
    ):
        return __import__(
            "starlette.responses", fromlist=["JSONResponse"]
        ).JSONResponse({"detail": "Origin not allowed"}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


def current(request: Request, s: Session = Depends(db)):
    try:
        payload = jwt.decode(
            request.cookies.get("session", ""), SECRET, algorithms=["HS256"]
        )
        user = s.get(User, payload["sub"])
        if not user:
            raise ValueError()
        workspace = s.get(Workspace, user.workspace_id)
        created = workspace.created_at.replace(tzinfo=timezone.utc)
        if workspace.demo and datetime.now(timezone.utc) - created > timedelta(hours=8):
            raise ValueError()
        return user
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401, "Please sign in again")


def staff(user: User = Depends(current)):
    if user.role not in ("admin", "staff"):
        raise HTTPException(403, "Staff access required")
    return user


def admin(user: User = Depends(current)):
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user


def own(s, cls, ident, user):
    obj = s.get(cls, ident)
    if not obj or obj.workspace_id != user.workspace_id:
        raise HTTPException(404, "Record not found")
    if (
        user.role == "customer"
        and getattr(obj, "customer_id", obj.id) != user.customer_id
    ):
        raise HTTPException(404, "Record not found")
    return obj


def serialize(obj, exclude=()):
    return {
        c.name: str(getattr(obj, c.name))
        if isinstance(getattr(obj, c.name), Decimal)
        else getattr(obj, c.name)
        for c in obj.__table__.columns
        if c.name not in ("password_hash", *exclude)
    }


def signin(response, user):
    token = jwt.encode(
        {"sub": user.id, "exp": datetime.now(timezone.utc) + timedelta(hours=8)},
        SECRET,
        algorithm="HS256",
    )
    response.set_cookie(
        "session",
        token,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false") == "true",
        samesite=os.getenv("COOKIE_SAMESITE", "lax"),
        max_age=28800,
    )
    return serialize(user)


class Register(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=9, max_length=128)

    @model_validator(mode="after")
    def strong(self):
        if not all(
            re.search(p, self.password) for p in ("[A-Z]", "[a-z]", r"[^A-Za-z0-9\s]")
        ):
            raise ValueError(
                "Password needs uppercase, lowercase and a special character"
            )
        return self


class Login(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


@app.get("/api/health")
def health(s: Session = Depends(db)):
    s.execute(select(1))
    return {"status": "ok"}


@app.post("/api/auth/register", status_code=201)
def register(data: Register, response: Response, s: Session = Depends(db)):
    # Registration creates a customer, never a privileged user.
    w = Workspace()
    s.add(w)
    s.flush()
    c = Customer(workspace_id=w.id, name=data.name, email=str(data.email).lower())
    s.add(c)
    s.flush()
    u = User(
        workspace_id=w.id,
        customer_id=c.id,
        name=data.name,
        email=str(data.email).lower(),
        password_hash=hasher.hash(data.password),
        role="customer",
    )
    s.add(u)
    try:
        s.commit()
    except IntegrityError:
        s.rollback()
        raise HTTPException(409, "Email already registered")
    return signin(response, u)


@app.post("/api/auth/login")
def login(data: Login, response: Response, s: Session = Depends(db)):
    u = s.scalar(select(User).where(User.email == str(data.email).lower()))
    if not u or not hasher.verify(data.password, u.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return signin(response, u)


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"ok": True}


@app.get("/api/auth/me")
def me(u: User = Depends(current), s: Session = Depends(db)):
    return {**serialize(u), "demo": s.get(Workspace, u.workspace_id).demo}


@app.post("/api/staff", status_code=201)
def create_staff(data: Register, u: User = Depends(admin), s: Session = Depends(db)):
    obj = User(
        workspace_id=u.workspace_id,
        name=data.name,
        email=str(data.email).lower(),
        password_hash=hasher.hash(data.password),
        role="staff",
    )
    s.add(obj)
    try:
        s.commit()
    except IntegrityError:
        s.rollback()
        raise HTTPException(409, "Email already registered")
    return serialize(obj)


class CustomerIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: str = Field(default="", max_length=160)


@app.post("/api/customers", status_code=201)
def create_customer(
    data: CustomerIn, u: User = Depends(staff), s: Session = Depends(db)
):
    obj = Customer(workspace_id=u.workspace_id, **data.model_dump())
    s.add(obj)
    s.commit()
    return serialize(obj)


@app.post("/api/customers/{ident}/account", status_code=201)
def customer_account(
    ident: str, data: Register, u: User = Depends(admin), s: Session = Depends(db)
):
    customer = own(s, Customer, ident, u)
    if str(data.email).lower() != customer.email.lower():
        raise HTTPException(422, "Use the customer record email")
    obj = User(
        workspace_id=u.workspace_id,
        customer_id=customer.id,
        name=data.name,
        email=str(data.email).lower(),
        password_hash=hasher.hash(data.password),
        role="customer",
    )
    s.add(obj)
    try:
        s.commit()
    except IntegrityError:
        s.rollback()
        raise HTTPException(409, "Email already registered")
    return serialize(obj)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    type: Literal["software", "service"] = "software"
    sales_price: Decimal = Field(ge=0, le=100000000, decimal_places=2)
    cost_price: Decimal = Field(
        default=Decimal("0.00"), ge=0, le=100000000, decimal_places=2
    )
    notes: str = Field(default="", max_length=2000)
    active: bool = True


@app.post("/api/products", status_code=201)
def create_product(data: ProductIn, u: User = Depends(staff), s: Session = Depends(db)):
    obj = Product(workspace_id=u.workspace_id, **data.model_dump())
    s.add(obj)
    s.commit()
    return serialize(obj)


@app.patch("/api/products/{ident}")
def edit_product(
    ident: str, data: ProductIn, u: User = Depends(staff), s: Session = Depends(db)
):
    obj = own(s, Product, ident, u)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    s.commit()
    return serialize(obj)


class VariantIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    adjustment: Decimal = Field(ge=0, le=100000000, decimal_places=2)


@app.post("/api/products/{ident}/variants", status_code=201)
def variant(
    ident: str, data: VariantIn, u: User = Depends(staff), s: Session = Depends(db)
):
    own(s, Product, ident, u)
    obj = Variant(product_id=ident, **data.model_dump())
    s.add(obj)
    s.commit()
    return serialize(obj)


class PlanIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    interval: Literal["daily", "weekly", "monthly", "yearly"]
    price: Decimal = Field(ge=0, le=100000000, decimal_places=2)
    minimum_quantity: int = Field(default=1, ge=1, le=10000)
    available_from: date | None = None
    available_until: date | None = None

    @model_validator(mode="after")
    def dates(self):
        if (
            self.available_from
            and self.available_until
            and self.available_from > self.available_until
        ):
            raise ValueError("Invalid availability dates")
        return self


@app.post("/api/plans", status_code=201)
def create_plan(data: PlanIn, u: User = Depends(staff), s: Session = Depends(db)):
    obj = Plan(workspace_id=u.workspace_id, **data.model_dump())
    s.add(obj)
    s.commit()
    return serialize(obj)


@app.patch("/api/plans/{ident}")
def edit_plan(
    ident: str, data: PlanIn, u: User = Depends(staff), s: Session = Depends(db)
):
    obj = own(s, Plan, ident, u)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    s.commit()
    return serialize(obj)


class LineIn(BaseModel):
    product_id: str
    variant_id: str | None = None
    quantity: int = Field(ge=1, le=10000)


class SubscriptionIn(BaseModel):
    customer_id: str
    plan_id: str
    start_date: date
    items: list[LineIn] = Field(min_length=1, max_length=50)
    tax_percent: Decimal = Field(default=0, ge=0, le=100, decimal_places=2)


@app.post("/api/subscriptions", status_code=201)
def create_subscription(
    data: SubscriptionIn, u: User = Depends(staff), s: Session = Depends(db)
):
    own(s, Customer, data.customer_id, u)
    p = own(s, Plan, data.plan_id, u)
    if (p.available_from and data.start_date < p.available_from) or (
        p.available_until and data.start_date > p.available_until
    ):
        raise HTTPException(422, "Plan unavailable on start date")
    if sum(x.quantity for x in data.items) < p.minimum_quantity:
        raise HTTPException(422, "Plan minimum quantity not met")
    sub = Subscription(
        workspace_id=u.workspace_id,
        number="SUB-" + secrets.token_hex(5).upper(),
        customer_id=data.customer_id,
        plan_id=p.id,
        start_date=data.start_date,
        next_billing=data.start_date,
        anchor_day=data.start_date.day,
        tax_percent=data.tax_percent,
        plan_price=p.price,
        interval=p.interval,
    )
    s.add(sub)
    s.flush()
    for item in data.items:
        product = own(s, Product, item.product_id, u)
        if not product.active:
            raise HTTPException(422, "Product is archived")
        price = product.sales_price
        name = product.name
        if item.variant_id:
            v = s.get(Variant, item.variant_id)
            if not v or v.product_id != product.id:
                raise HTTPException(422, "Invalid variant")
            price += v.adjustment
            name += " / " + v.name
        s.add(
            SubscriptionItem(
                subscription_id=sub.id,
                product_id=product.id,
                description=name,
                quantity=item.quantity,
                unit_price=price,
            )
        )
    s.commit()
    return serialize(sub)


class Transition(BaseModel):
    status: Literal["quotation", "confirmed", "active", "closed"]


@app.patch("/api/subscriptions/{ident}/status")
def transition(
    ident: str, data: Transition, u: User = Depends(staff), s: Session = Depends(db)
):
    sub = own(s, Subscription, ident, u)
    allowed = {
        "draft": ["quotation", "closed"],
        "quotation": ["confirmed", "closed"],
        "confirmed": ["active", "closed"],
        "active": ["closed"],
        "closed": [],
    }
    if data.status not in allowed[sub.status]:
        raise HTTPException(409, "Invalid lifecycle transition")
    sub.status = data.status
    s.commit()
    return serialize(sub)


def money(x):
    return Decimal(x).quantize(Decimal(".01"), rounding=ROUND_HALF_UP)


def billing_today():
    return datetime.now(timezone.utc).date()


def next_cycle(d, interval, anchor):
    if interval == "daily":
        return d + timedelta(days=1)
    if interval == "weekly":
        return d + timedelta(days=7)
    year = d.year + (1 if interval == "yearly" or d.month == 12 else 0)
    month = d.month if interval == "yearly" else d.month % 12 + 1
    return date(year, month, min(anchor, monthrange(year, month)[1]))


class BillIn(BaseModel):
    cycle_date: date


@app.post("/api/subscriptions/{ident}/invoices")
def generate(
    ident: str, data: BillIn, u: User = Depends(staff), s: Session = Depends(db)
):
    sub = own(s, Subscription, ident, u)
    sub = s.scalar(
        select(Subscription)
        .where(Subscription.id == sub.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    existing = s.scalar(
        select(Invoice).where(
            Invoice.subscription_id == ident, Invoice.cycle_date == data.cycle_date
        )
    )
    if existing:
        return serialize(existing)
    if sub.status != "active":
        raise HTTPException(409, "Activate the subscription before billing")
    if data.cycle_date != sub.next_billing or data.cycle_date > billing_today():
        raise HTTPException(
            409, "Bill the next due cycle; future billing is unavailable"
        )
    lines = list(
        s.scalars(
            select(SubscriptionItem).where(SubscriptionItem.subscription_id == ident)
        )
    )
    subtotal = money(
        sub.plan_price + sum((x.unit_price * x.quantity for x in lines), Decimal(0))
    )
    tax = money(subtotal * sub.tax_percent / 100)
    inv = Invoice(
        workspace_id=u.workspace_id,
        number="INV-" + secrets.token_hex(5).upper(),
        subscription_id=sub.id,
        customer_id=sub.customer_id,
        cycle_date=data.cycle_date,
        due_date=data.cycle_date + timedelta(days=14),
        subtotal=subtotal,
        tax=tax,
        total=subtotal + tax,
    )
    s.add(inv)
    s.flush()
    for x in lines:
        s.add(
            InvoiceItem(
                invoice_id=inv.id,
                description=x.description,
                quantity=x.quantity,
                unit_price=x.unit_price,
            )
        )
    if sub.plan_price:
        s.add(
            InvoiceItem(
                invoice_id=inv.id,
                description="Plan fee",
                quantity=1,
                unit_price=sub.plan_price,
            )
        )
    sub.next_billing = next_cycle(sub.next_billing, sub.interval, sub.anchor_day)
    try:
        s.commit()
    except IntegrityError:
        s.rollback()
        inv = s.scalar(
            select(Invoice).where(
                Invoice.subscription_id == ident, Invoice.cycle_date == data.cycle_date
            )
        )
        if not inv:
            raise HTTPException(409, "Billing conflict; retry")
    return serialize(inv)


@app.post("/api/invoices/{ident}/confirm")
def confirm(ident: str, u: User = Depends(staff), s: Session = Depends(db)):
    inv = own(s, Invoice, ident, u)
    if inv.status != "draft":
        raise HTTPException(409, "Only draft invoices can be confirmed")
    inv.status = "confirmed"
    s.commit()
    return serialize(inv)


class PaymentIn(BaseModel):
    amount: Decimal = Field(gt=0, le=1000000000000, decimal_places=2)
    method: Literal["bank_transfer", "card", "cash"]
    date: date
    notes: str = Field(default="", max_length=1000)
    idempotency_key: str = Field(min_length=8, max_length=100)


@app.post("/api/invoices/{ident}/payments", status_code=201)
def pay(
    ident: str, data: PaymentIn, u: User = Depends(staff), s: Session = Depends(db)
):
    inv = own(s, Invoice, ident, u)
    inv = s.scalar(
        select(Invoice)
        .where(Invoice.id == inv.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    existing = s.scalar(
        select(Payment).where(
            Payment.invoice_id == ident, Payment.idempotency_key == data.idempotency_key
        )
    )
    if existing:
        return serialize(existing)
    if inv.status != "confirmed":
        raise HTTPException(409, "Confirm the invoice before recording payment")
    if data.date > billing_today():
        raise HTTPException(422, "Payment date cannot be in the future")
    paid = s.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.invoice_id == ident
        )
    )
    if data.amount > inv.total - paid:
        raise HTTPException(422, "Payment exceeds outstanding balance")
    p = Payment(workspace_id=u.workspace_id, invoice_id=ident, **data.model_dump())
    s.add(p)
    if paid + data.amount == inv.total:
        inv.status = "paid"
    try:
        s.commit()
    except IntegrityError:
        s.rollback()
        raise HTTPException(409, "Payment conflict; refresh before retrying")
    return serialize(p)


TABLES = {
    "products": Product,
    "plans": Plan,
    "customers": Customer,
    "subscriptions": Subscription,
    "invoices": Invoice,
    "payments": Payment,
}


@app.get("/api/records/{kind}")
def records(
    kind: str,
    offset: int = 0,
    limit: int = 100,
    u: User = Depends(current),
    s: Session = Depends(db),
):
    if kind not in TABLES:
        raise HTTPException(404, "Unknown collection")
    cls = TABLES[kind]
    q = select(cls).where(cls.workspace_id == u.workspace_id)
    if u.role == "customer":
        if kind == "customers":
            q = q.where(Customer.id == u.customer_id)
        elif kind in ("subscriptions", "invoices"):
            q = q.where(cls.customer_id == u.customer_id)
        elif kind == "payments":
            q = q.where(
                Payment.invoice_id.in_(
                    select(Invoice.id).where(Invoice.customer_id == u.customer_id)
                )
            )
    rows = list(
        s.scalars(
            q.order_by(cls.id).offset(max(offset, 0)).limit(min(max(limit, 1), 200))
        )
    )
    result = []
    for row in rows:
        item = serialize(row, ("cost_price",) if u.role == "customer" else ())
        if kind == "products":
            item["variants"] = [
                serialize(v)
                for v in s.scalars(select(Variant).where(Variant.product_id == row.id))
            ]
        if kind == "subscriptions":
            item["customer_name"] = s.get(Customer, row.customer_id).name
            item["plan_name"] = s.get(Plan, row.plan_id).name
            item["items"] = [
                serialize(x)
                for x in s.scalars(
                    select(SubscriptionItem).where(
                        SubscriptionItem.subscription_id == row.id
                    )
                )
            ]
        if kind == "invoices":
            item["customer_name"] = s.get(Customer, row.customer_id).name
            item["paid"] = s.scalar(
                select(func.coalesce(func.sum(Payment.amount), 0)).where(
                    Payment.invoice_id == row.id
                )
            )
            item["balance"] = str(row.total - item["paid"])
            item["paid"] = str(item["paid"])
            item["overdue"] = (
                row.status == "confirmed" and row.due_date < billing_today()
            )
            item["items"] = [
                serialize(x)
                for x in s.scalars(
                    select(InvoiceItem).where(InvoiceItem.invoice_id == row.id)
                )
            ]
        result.append(item)
    return result


@app.get("/api/dashboard")
def dashboard(u: User = Depends(current), s: Session = Depends(db)):
    subs = select(Subscription).where(Subscription.workspace_id == u.workspace_id)
    invs = select(Invoice).where(Invoice.workspace_id == u.workspace_id)
    payments = select(Payment).where(Payment.workspace_id == u.workspace_id)
    if u.role == "customer":
        subs = subs.where(Subscription.customer_id == u.customer_id)
        invs = invs.where(Invoice.customer_id == u.customer_id)
        payments = payments.where(
            Payment.invoice_id.in_(
                select(Invoice.id).where(Invoice.customer_id == u.customer_id)
            )
        )
    active = s.scalar(
        select(func.count()).select_from(
            subs.where(Subscription.status == "active").subquery()
        )
    )
    collected = s.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.id.in_(payments.with_only_columns(Payment.id))
        )
    )
    billed = s.scalar(
        select(func.coalesce(func.sum(Invoice.total), 0)).where(
            Invoice.id.in_(
                invs.where(Invoice.status.in_(["confirmed", "paid"])).with_only_columns(
                    Invoice.id
                )
            )
        )
    )
    overdue = s.scalar(
        select(func.count()).select_from(
            invs.where(
                Invoice.status == "confirmed", Invoice.due_date < billing_today()
            ).subquery()
        )
    )
    upcoming = list(
        s.scalars(
            subs.where(
                Subscription.status == "active",
                Subscription.next_billing <= billing_today() + timedelta(days=14),
            )
            .order_by(Subscription.next_billing)
            .limit(8)
        )
    )
    history = {}
    for p in s.scalars(payments.order_by(Payment.date)):
        key = p.date.strftime("%Y-%m")
        history[key] = history.get(key, Decimal(0)) + p.amount
    return {
        "active_subscriptions": active,
        "collected": str(collected),
        "outstanding": str(billed - collected),
        "overdue_invoices": overdue,
        "history": [
            {"month": k, "amount": str(v)} for k, v in sorted(history.items())[-6:]
        ],
        "renewals": [serialize(x) for x in upcoming],
    }


class DemoIn(BaseModel):
    role: Literal["admin", "staff", "customer"] = "admin"


@app.post("/api/auth/demo")
def demo(data: DemoIn, response: Response, s: Session = Depends(db)):
    if os.getenv("DEMO_ENABLED", "false") != "true":
        raise HTTPException(404, "Demo disabled")
    w = Workspace(demo=True)
    s.add(w)
    s.flush()
    customers = []
    for name, company in [
        ("Alex Morgan", "Acme Studio"),
        ("Priya Shah", "Orbit Labs"),
        ("Jordan Lee", "Forma Design"),
    ]:
        c = Customer(
            workspace_id=w.id,
            name=name,
            email=name.split()[0].lower() + "@example.com",
            company=company,
        )
        s.add(c)
        s.flush()
        customers.append(c)
    p = Product(
        workspace_id=w.id,
        name="Workspace Pro",
        type="software",
        sales_price=Decimal("1490"),
        cost_price=Decimal("450"),
        notes="Collaboration, projects and reporting for growing teams.",
    )
    s.add(p)
    p2 = Product(
        workspace_id=w.id,
        name="Priority Support",
        type="service",
        sales_price=Decimal("990"),
        cost_price=Decimal("300"),
        notes="Dedicated support for your team.",
    )
    s.add(p2)
    plan = Plan(
        workspace_id=w.id,
        name="Growth Monthly",
        interval="monthly",
        price=Decimal("500"),
        minimum_quantity=1,
    )
    s.add(plan)
    s.flush()
    s.add(Variant(product_id=p.id, name="Odoo", adjustment=Decimal("560")))
    s.add(
        Plan(
            workspace_id=w.id,
            name="Scale Annual",
            interval="yearly",
            price=Decimal("4990"),
            minimum_quantity=5,
        )
    )
    for i, c in enumerate(customers):
        cycle = billing_today() - timedelta(days=35 + i)
        sub = Subscription(
            workspace_id=w.id,
            number="SUB-" + secrets.token_hex(5).upper(),
            customer_id=c.id,
            plan_id=plan.id,
            status="active",
            start_date=cycle,
            next_billing=billing_today() + timedelta(days=i * 4),
            anchor_day=cycle.day,
            tax_percent=Decimal("18"),
            plan_price=plan.price,
            interval=plan.interval,
        )
        s.add(sub)
        s.flush()
        s.add(
            SubscriptionItem(
                subscription_id=sub.id,
                product_id=p.id,
                description=p.name,
                quantity=i + 1,
                unit_price=p.sales_price,
            )
        )
        subtotal = money(plan.price + p.sales_price * (i + 1))
        tax = money(subtotal * Decimal(".18"))
        inv = Invoice(
            workspace_id=w.id,
            number="INV-" + secrets.token_hex(5).upper(),
            subscription_id=sub.id,
            customer_id=c.id,
            cycle_date=cycle,
            due_date=cycle + timedelta(days=14),
            status="paid" if i == 0 else "confirmed",
            subtotal=subtotal,
            tax=tax,
            total=subtotal + tax,
        )
        s.add(inv)
        s.flush()
        s.add(
            InvoiceItem(
                invoice_id=inv.id,
                description=p.name,
                quantity=i + 1,
                unit_price=p.sales_price,
            )
        )
        s.add(
            InvoiceItem(
                invoice_id=inv.id,
                description="Plan fee",
                quantity=1,
                unit_price=plan.price,
            )
        )
        if i == 0:
            s.add(
                Payment(
                    workspace_id=w.id,
                    invoice_id=inv.id,
                    amount=inv.total,
                    method="bank_transfer",
                    date=billing_today() - timedelta(days=20),
                    notes="Sample payment",
                    idempotency_key=secrets.token_hex(12),
                )
            )
    u = User(
        workspace_id=w.id,
        name="Demo " + data.role.title(),
        email=secrets.token_hex(12) + "@demo.invalid",
        password_hash=hasher.hash(secrets.token_urlsafe(32)),
        role=data.role,
        customer_id=customers[0].id if data.role == "customer" else None,
    )
    s.add(u)
    s.commit()
    return signin(response, u)
