"""
Notification system for Aegis.
Supports email (Flask-Mail) and Slack (slack_sdk).
Both are optional — missing config = silent skip, never crash.
"""
import logging

logger = logging.getLogger("notifications")


# ── Helpers ────────────────────────────────────────────────────────────────

def _vuln_counts(scan_id: int):
    """Return (total, critical, high) vulnerability counts for a scan."""
    from models import Vulnerability
    vulns = Vulnerability.query.filter_by(scan_id=scan_id).all()
    total    = len(vulns)
    critical = sum(1 for v in vulns if (v.severity or "").lower() in ("critical",))
    high     = sum(1 for v in vulns if (v.severity or "").lower() in ("high",))
    return total, critical, high


# ── Email ─────────────────────────────────────────────────────────────────

def send_scan_completion_email(app, scan_id: int):
    """
    Send an email alert when a scan finishes with high/critical findings.
    Requires MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD, ALERT_EMAIL in config.
    Silently skips if mail is not configured.
    """
    if not app.config.get("MAIL_SERVER"):
        logger.debug("Mail not configured — skipping email notification.")
        return

    with app.app_context():
        from models import db, Scan

        scan = db.session.get(Scan, scan_id)
        if not scan:
            return

        total, critical, high = _vuln_counts(scan_id)
        at_risk = critical + high

        if at_risk == 0:
            logger.debug(f"Scan #{scan_id}: no high/critical vulns — skipping email.")
            return

        recipient = app.config.get("ALERT_EMAIL") or app.config.get("MAIL_USERNAME")
        if not recipient:
            logger.warning("ALERT_EMAIL not set — cannot send email notification.")
            return

        subject = (
            f"🔴 Aegis Alert: {critical} Critical + {high} High vulns on {scan.target}"
            if critical > 0
            else f"⚠️ Aegis Alert: {high} High-severity vulns on {scan.target}"
        )

        end_str = (
            scan.end_time.strftime("%Y-%m-%d %H:%M UTC") if scan.end_time else "In Progress"
        )

        body = f"""\
Aegis Security Platform — Scan Completed
=========================================

Scan ID   : #{scan_id}
Target    : {scan.target}
Completed : {end_str}

VULNERABILITY SUMMARY
---------------------
  Critical : {critical}
  High     : {high}
  Total    : {total}

ACTION REQUIRED
---------------
{"⛔ Immediate action required — critical vulnerabilities detected." if critical > 0 else "Please review high-severity findings promptly."}

Open the dashboard: http://localhost:3000/scans
"""

        try:
            from flask_mail import Message
            mail = app.extensions.get("mail")
            if not mail:
                logger.warning("Flask-Mail extension not initialised.")
                return

            msg = Message(subject=subject, recipients=[recipient], body=body)
            mail.send(msg)
            logger.info(f"Email alert sent to {recipient} for scan #{scan_id}.")
        except ImportError:
            logger.warning("flask_mail not installed — pip install Flask-Mail")
        except Exception as e:
            logger.error(f"Failed to send email for scan #{scan_id}: {e}")


# ── Slack ─────────────────────────────────────────────────────────────────

def send_slack_notification(app, scan_id: int):
    """
    Post a Slack message when a scan finishes.
    Requires SLACK_BOT_TOKEN and SLACK_CHANNEL in config.
    Silently skips if not configured.
    """
    token   = app.config.get("SLACK_BOT_TOKEN")
    channel = app.config.get("SLACK_CHANNEL", "#security-alerts")

    if not token:
        logger.debug("SLACK_BOT_TOKEN not set — skipping Slack notification.")
        return

    with app.app_context():
        from models import db, Scan

        scan = db.session.get(Scan, scan_id)
        if not scan:
            return

        total, critical, high = _vuln_counts(scan_id)

        if critical > 0:
            emoji   = "🔴"
            urgency = "*Immediate action required*"
        elif high > 0:
            emoji   = "🟠"
            urgency = "Review recommended"
        else:
            emoji   = "🟢"
            urgency = "No critical findings"

        text = (
            f"{emoji} *Aegis Scan Completed* — `{scan.target}`\n"
            f">Scan ID: #{scan_id}  |  Status: {scan.status}\n"
            f">Critical: *{critical}*  |  High: *{high}*  |  Total: {total}\n"
            f">{urgency}"
        )

        try:
            from slack_sdk import WebClient
            from slack_sdk.errors import SlackApiError

            client = WebClient(token=token)
            client.chat_postMessage(channel=channel, text=text, mrkdwn=True)
            logger.info(f"Slack notification sent to {channel} for scan #{scan_id}.")
        except ImportError:
            logger.warning("slack_sdk not installed — pip install slack_sdk")
        except SlackApiError as e:
            logger.error(f"Slack API error for scan #{scan_id}: {e.response['error']}")
        except Exception as e:
            logger.error(f"Slack notification failed for scan #{scan_id}: {e}")


# ── Unified dispatcher ────────────────────────────────────────────────────

def notify_scan_complete(app, scan_id: int):
    """Call both email and Slack — safe to call from scanner.py after scan finishes."""
    send_scan_completion_email(app, scan_id)
    send_slack_notification(app, scan_id)