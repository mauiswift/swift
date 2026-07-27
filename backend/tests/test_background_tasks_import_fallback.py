import importlib
import sys


def test_background_tasks_imports_without_legacy_magpie_module(monkeypatch):
    real_import_module = importlib.import_module

    def fake_import_module(name, package=None):
        if name in {"services.magpie_service", "services.magpie_services"}:
            raise ModuleNotFoundError(name)
        return real_import_module(name, package)

    monkeypatch.setattr(importlib, "import_module", fake_import_module)
    sys.modules.pop("services.background_tasks", None)

    module = importlib.import_module("services.background_tasks")

    assert module.MagpieService is None
    assert hasattr(module, "background_worker")
