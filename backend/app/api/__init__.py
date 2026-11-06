from app.api import attendance, auth, admissions, cash, dashboard, fees, gaps, hr, legacy, notifications, org, reports, students, tasks


def register_blueprints(app, prefix: str):
    for m in (auth, org, students, admissions, fees, cash, attendance, hr, gaps, tasks, reports, notifications, dashboard, legacy):
        app.register_blueprint(m.bp, url_prefix=f"{prefix}{m.bp.url_prefix or ''}")
