"""
Background scheduler for automated security scans.
Runs daily at 02:00 UTC and re-scans all known VMs.
"""
import logging
import datetime
import threading

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger("scheduler")

_scheduler: BackgroundScheduler | None = None


def _do_scheduled_scan(app, vm_ip: str, scan_id: int):
    """Run a single scan in its own thread with app context."""
    from scanner.scanner import run_scan
    with app.app_context():
        try:
            run_scan(scan_id, vm_ip, mode="fast")
        except Exception:
            logger.exception(f"Scheduled scan failed for {vm_ip} (scan #{scan_id})")


def scheduled_vm_scan(app):
    """Queue a fast scan for every known VM. Called by APScheduler."""
    with app.app_context():
        from models import db, VM, Scan

        vms = VM.query.all()
        if not vms:
            logger.info("Scheduled scan: no VMs registered, skipping.")
            return

        logger.info(f"Scheduled scan: queuing {len(vms)} VM(s).")

        for vm in vms:
            try:
                scan = Scan(
                    target     = vm.ip_address,
                    status     = "queued",
                    mode       = "fast",
                    start_time = datetime.datetime.now(datetime.timezone.utc),
                    phase      = "scheduled",
                    progress   = 0,
                )
                db.session.add(scan)
                db.session.commit()

                t = threading.Thread(
                    target=_do_scheduled_scan,
                    args=(app, vm.ip_address, scan.id),
                    daemon=True,
                )
                t.start()
                logger.info(f"Scheduled scan #{scan.id} started for {vm.ip_address}")

            except Exception:
                logger.exception(f"Could not queue scheduled scan for {vm.ip_address}")
                db.session.rollback()


def start_scheduler(app):
    """Initialise and start the APScheduler background scheduler."""
    global _scheduler

    if not app.config.get("SCHEDULER_ENABLED", True):
        logger.info("Scheduler disabled via config — skipping.")
        return None

    if _scheduler and _scheduler.running:
        logger.warning("Scheduler already running.")
        return _scheduler

    _scheduler = BackgroundScheduler(timezone="UTC")

    # Daily scan at 02:00 UTC
    _scheduler.add_job(
        func          = lambda: scheduled_vm_scan(app),
        trigger       = CronTrigger(hour=2, minute=0, timezone="UTC"),
        id            = "daily_vm_scan",
        name          = "Daily VM Security Scan",
        replace_existing = True,
        misfire_grace_time = 600,   # allow up to 10 min late start
    )

    # Optional: weekly deep scan Sunday 03:00 UTC
    _scheduler.add_job(
        func          = lambda: scheduled_vm_scan(app),
        trigger       = CronTrigger(day_of_week="sun", hour=3, minute=0, timezone="UTC"),
        id            = "weekly_deep_scan",
        name          = "Weekly Deep VM Scan",
        replace_existing = True,
        misfire_grace_time = 1800,
    )

    _scheduler.start()
    logger.info("Scheduler started — daily fast scan 02:00 UTC, weekly deep scan Sun 03:00 UTC.")
    return _scheduler


def stop_scheduler():
    """Gracefully shut down the scheduler (call on app teardown)."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")
    _scheduler = None