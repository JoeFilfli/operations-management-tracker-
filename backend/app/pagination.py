from __future__ import annotations

from dataclasses import dataclass

from flask import request
from sqlalchemy import Select, func
from sqlalchemy.orm import Query

from .extensions import db

DEFAULT_PER_PAGE = 20
MAX_PER_PAGE = 100


@dataclass
class PageArgs:
    page: int
    per_page: int


def page_args() -> PageArgs:
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = int(request.args.get("per_page", DEFAULT_PER_PAGE))
    except (TypeError, ValueError):
        per_page = DEFAULT_PER_PAGE
    per_page = max(1, min(per_page, MAX_PER_PAGE))
    return PageArgs(page=page, per_page=per_page)


def paginate(stmt: Select, schema, args: PageArgs | None = None) -> dict:
    args = args or page_args()
    total = db.session.scalar(
        db.select(func.count()).select_from(stmt.order_by(None).subquery())
    )
    rows = db.session.scalars(
        stmt.limit(args.per_page).offset((args.page - 1) * args.per_page)
    ).all()
    pages = (total + args.per_page - 1) // args.per_page if total else 0
    return {
        "items": schema.dump(rows, many=True),
        "page": args.page,
        "per_page": args.per_page,
        "total": total,
        "pages": pages,
    }


def paginate_query(query: Query, schema, args: PageArgs | None = None) -> dict:
    """Legacy-style pagination for ``db.session.query(...)`` callers."""
    args = args or page_args()
    total = query.order_by(None).count()
    rows = query.limit(args.per_page).offset((args.page - 1) * args.per_page).all()
    pages = (total + args.per_page - 1) // args.per_page if total else 0
    return {
        "items": schema.dump(rows, many=True),
        "page": args.page,
        "per_page": args.per_page,
        "total": total,
        "pages": pages,
    }
