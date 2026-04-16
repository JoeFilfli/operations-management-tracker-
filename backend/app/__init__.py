from __future__ import annotations

from flask import Flask

from .config import BaseConfig, get_config
from .extensions import cors, db, jwt, migrate


def create_app(config: type[BaseConfig] | str | None = None) -> Flask:
    app = Flask(__name__)

    if isinstance(config, str) or config is None:
        config_cls = get_config(config)
    else:
        config_cls = config
    app.config.from_object(config_cls)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})

    from . import models  # noqa: F401  (register mappers)
    from .activity import register_activity_hooks
    from .cli import register_cli_commands
    from .errors import register_error_handlers
    from .resources import register_resources

    register_error_handlers(app)
    register_resources(app)
    register_activity_hooks()
    register_cli_commands(app)

    return app
