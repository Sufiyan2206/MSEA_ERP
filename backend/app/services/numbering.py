"""Sequential document numbers (receipts, handovers, leads, gaps, refunds, report runs).

Numbers are per prefix (+ optional branch code) and per financial year, generated
with SELECT ... FOR UPDATE on the settings row so concurrent cashiers never
collide. Format: <PREFIX>/<BRANCH>/<FY>/<000001>.
"""
from datetime import date

from sqlalchemy import select

from app.models import Setting


def fy(d: date | None = None) -> str:
    d = d or date.today()
    y = d.year if d.month >= 4 else d.year - 1
    return f"{y % 100:02d}{(y + 1) % 100:02d}"


def next_no(s, prefix: str, branch_code: str | None = None, d: date | None = None) -> str:
    key = f"seq:{prefix}:{branch_code or 'ALL'}:{fy(d)}"
    row = s.execute(select(Setting).where(Setting.key == key).with_for_update()).scalar_one_or_none()
    if row is None:
        row = Setting(key=key, value=0)
        s.add(row)
        s.flush()
    n = int(row.value or 0) + 1
    row.value = n
    parts = [prefix] + ([branch_code] if branch_code else []) + [fy(d), f"{n:06d}"]
    return "/".join(parts)
