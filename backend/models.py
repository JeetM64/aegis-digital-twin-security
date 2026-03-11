import datetime
from flask_sqlalchemy import SQLAlchemy
import bcrypt as bcrypt_lib

db = SQLAlchemy()

ROLE_ADMIN   = "Admin"
ROLE_ANALYST = "Analyst"
ROLE_VIEWER  = "Viewer"


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(128), unique=True, nullable=False, index=True)
    email         = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.String(32), default=ROLE_VIEWER, nullable=False)
    is_active     = db.Column(db.Boolean, default=True, nullable=False)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.datetime.utcnow())

    def set_password(self, raw_password: str) -> None:
        salt = bcrypt_lib.gensalt()
        self.password_hash = bcrypt_lib.hashpw(
            raw_password.encode("utf-8"), salt
        ).decode("utf-8")

    def check_password(self, raw_password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt_lib.checkpw(
            raw_password.encode("utf-8"),
            self.password_hash.encode("utf-8")
        )

    def to_dict(self) -> dict:
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "role":       self.role,
            "is_active":  self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RevokedToken(db.Model):
    __tablename__ = "revoked_tokens"

    id         = db.Column(db.Integer, primary_key=True)
    jti        = db.Column(db.String(128), nullable=False, unique=True, index=True)
    token_type = db.Column(db.String(32), nullable=False)
    revoked_at = db.Column(db.DateTime, default=lambda: datetime.datetime.utcnow())

    @classmethod
    def add(cls, jti: str, token_type: str) -> bool:
        if not cls.query.filter_by(jti=jti).first():
            r = cls(jti=jti, token_type=token_type)
            db.session.add(r)
            db.session.commit()
            return True
        return False

    @classmethod
    def is_revoked(cls, jti: str) -> bool:
        return cls.query.filter_by(jti=jti).first() is not None


class Scan(db.Model):
    __tablename__ = "scan"

    id         = db.Column(db.Integer, primary_key=True)
    target     = db.Column(db.String(255), nullable=False, index=True)
    mode       = db.Column(db.String(20), default="fast")
    status     = db.Column(db.String(20), default="pending", index=True)
    progress   = db.Column(db.Integer, default=0)
    phase      = db.Column(db.String(80), default="initializing")
    eta        = db.Column(db.String(32), default="")
    log        = db.Column(db.Text, default="")
    raw_output = db.Column(db.Text, nullable=True)

    # Stats populated after scan
    total_hosts         = db.Column(db.Integer, default=0)
    total_open_ports    = db.Column(db.Integer, default=0)
    total_vulns         = db.Column(db.Integer, default=0)
    critical_count      = db.Column(db.Integer, default=0)
    high_count          = db.Column(db.Integer, default=0)

    start_time = db.Column(db.DateTime, default=lambda: datetime.datetime.utcnow())
    end_time   = db.Column(db.DateTime, nullable=True)

    vulnerabilities = db.relationship(
        "Vulnerability",
        backref="scan",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def duration_seconds(self):
        if self.start_time and self.end_time:
            return int((self.end_time - self.start_time).total_seconds())
        return None


class VM(db.Model):
    __tablename__ = "vm"

    id         = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), unique=True, nullable=False, index=True)
    hostname   = db.Column(db.String(255), nullable=True)
    os         = db.Column(db.String(255), nullable=True)
    os_family  = db.Column(db.String(64), nullable=True)   # Windows / Linux / BSD etc.
    status     = db.Column(db.String(20), default="active")
    risk_level = db.Column(db.String(10), nullable=True)   # LOW / MEDIUM / HIGH / CRITICAL
    last_seen  = db.Column(db.DateTime, default=lambda: datetime.datetime.utcnow())
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.utcnow())

    vulnerabilities = db.relationship(
        "Vulnerability",
        backref="vm",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id":         self.id,
            "ip_address": self.ip_address,
            "hostname":   self.hostname,
            "os":         self.os,
            "os_family":  self.os_family,
            "status":     self.status,
            "risk_level": self.risk_level,
            "last_seen":  self.last_seen.isoformat() if self.last_seen else None,
        }


class Vulnerability(db.Model):
    __tablename__ = "vulnerability"

    id      = db.Column(db.Integer, primary_key=True)
    vm_id   = db.Column(db.Integer, db.ForeignKey("vm.id"),   nullable=True,  index=True)
    scan_id = db.Column(db.Integer, db.ForeignKey("scan.id"), nullable=False, index=True)

    # Port / service info
    port     = db.Column(db.Integer,     nullable=True, index=True)
    service  = db.Column(db.String(100), nullable=True)
    version  = db.Column(db.String(255), nullable=True)
    protocol = db.Column(db.String(10),  nullable=True, default="tcp")

    # Severity / scoring
    severity   = db.Column(db.String(20), nullable=True, index=True)   # critical/high/medium/low
    cvss_score = db.Column(db.Float,      nullable=True)
    risk_score = db.Column(db.Float,      nullable=True, index=True)   # composite 0-100

    # CVE data
    cve_ids   = db.Column(db.String(1000), nullable=True, default="")  # comma-separated
    cve_count = db.Column(db.Integer,      nullable=True, default=0)

    # Flags
    exploit_available = db.Column(db.Boolean, default=False)
    is_misconfigured  = db.Column(db.Boolean, default=False)
    internet_exposed  = db.Column(db.Boolean, default=False)

    # Description & remediation
    description        = db.Column(db.Text,    nullable=True)
    remediation        = db.Column(db.Text,    nullable=True)
    remediation_status = db.Column(db.String(20), default="open")  # open/in_progress/resolved/false_positive
    assigned_to        = db.Column(db.String(128), nullable=True)
    remediation_notes  = db.Column(db.Text,    nullable=True)
    resolved_at        = db.Column(db.DateTime, nullable=True)

    # Tracking
    issue_id   = db.Column(db.String(128), nullable=True, index=True)
    status     = db.Column(db.String(20),  default="open")
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.utcnow())

    def to_dict(self):
        return {
            "id":                 self.id,
            "scan_id":            self.scan_id,
            "vm_id":              self.vm_id,
            "port":               self.port,
            "service":            self.service,
            "version":            self.version,
            "protocol":           self.protocol,
            "severity":           self.severity,
            "cvss_score":         self.cvss_score,
            "risk_score":         round(self.risk_score, 2) if self.risk_score else 0,
            "cve_ids":            self.cve_ids or "",
            "cve_count":          self.cve_count or 0,
            "exploit_available":  self.exploit_available,
            "is_misconfigured":   self.is_misconfigured,
            "internet_exposed":   self.internet_exposed,
            "description":        self.description,
            "remediation":        self.remediation,
            "remediation_status": self.remediation_status,
            "status":             self.status,
        }