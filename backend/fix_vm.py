from app import create_app

app, _ = create_app()

with app.app_context():
    from models import db, VM, Vulnerability
    
    vm = VM.query.filter_by(ip_address='127.0.0.1').first()
    if vm:
        vulns = Vulnerability.query.all()
        for v in vulns:
            v.vm_id = vm.id
        db.session.commit()
        print(f"Fixed! Linked {len(vulns)} vulns to {vm.ip_address}")
    else:
        print("VM not found")