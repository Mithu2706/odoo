"""Create the first production administrator through an interactive prompt."""

import getpass
from sqlalchemy.orm import Session
from sqlalchemy import select
from .main import engine, hasher, Register
from .models import User, Workspace

if __name__ == "__main__":
    data = Register(
        name=input("Admin name: "),
        email=input("Admin email: "),
        password=getpass.getpass("Admin password: "),
    )
    with Session(engine) as s:
        if s.scalar(
            select(User).where(
                User.role == "admin",
                User.workspace_id.in_(
                    select(Workspace.id).where(Workspace.demo == False)
                ),
            )
        ):
            raise SystemExit("A production administrator already exists.")
        w = Workspace()
        s.add(w)
        s.flush()
        s.add(
            User(
                workspace_id=w.id,
                name=data.name,
                email=str(data.email).lower(),
                password_hash=hasher.hash(data.password),
                role="admin",
            )
        )
        s.commit()
        print("Administrator created. Sign in through the application.")
